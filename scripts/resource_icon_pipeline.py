#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from PIL import Image


RESAMPLE = Image.Resampling.LANCZOS
DEFAULT_MANIFEST = Path("assets/images/resources/normalized/manifest.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit and normalize resource icons without touching the originals."
    )
    parser.add_argument(
        "command",
        choices=("audit", "build"),
        help="`audit` writes reports only; `build` also renders masters and size variants.",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help=f"Path to the JSON manifest. Defaults to {DEFAULT_MANIFEST}.",
    )
    return parser.parse_args()


def load_manifest(path: Path) -> dict:
    data = json.loads(path.read_text())
    required = ("source_dir", "output_dir", "canvas_size", "safe_fraction", "small_sizes", "items")
    missing = [key for key in required if key not in data]
    if missing:
        missing_str = ", ".join(missing)
        raise ValueError(f"Manifest is missing required keys: {missing_str}")
    return data


def resolve_configured_path(value: str, cwd: Path) -> Path:
    path = Path(value)
    return path if path.is_absolute() else (cwd / path).resolve()


def analyze_image(image: Image.Image) -> dict:
    image = image.convert("RGBA")
    width, height = image.size
    total_pixels = width * height
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()

    transparent = 0
    semi_transparent = 0
    opaque = 0
    visible_pixels = 0
    alpha_sum = 0
    visible_luma_sum = 0.0
    visible_luma_max = 0.0
    opaque_luma_max = 0.0
    black_only = True
    unique_alpha_values = set()

    pixels = image.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            alpha_sum += a
            unique_alpha_values.add(a)

            if a == 0:
                transparent += 1
                continue

            visible_pixels += 1
            if a >= 250:
                opaque += 1
            else:
                semi_transparent += 1

            if (r, g, b) != (0, 0, 0):
                black_only = False

            luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            visible_luma_sum += luma
            if luma > visible_luma_max:
                visible_luma_max = luma
            if a >= 250 and luma > opaque_luma_max:
                opaque_luma_max = luma

    if bbox:
        left, top, right, bottom = bbox
        bbox_width = right - left
        bbox_height = bottom - top
        bbox_area = bbox_width * bbox_height
        bbox_fill_pct = (visible_pixels / bbox_area * 100.0) if bbox_area else 0.0
    else:
        left = top = right = bottom = 0
        bbox_width = bbox_height = bbox_area = 0
        bbox_fill_pct = 0.0

    aspect_ratio = (width / height) if height else 0.0
    avg_alpha_pct = (alpha_sum / (255.0 * total_pixels) * 100.0) if total_pixels else 0.0
    visible_pct = (visible_pixels / total_pixels * 100.0) if total_pixels else 0.0
    semi_pct = (semi_transparent / total_pixels * 100.0) if total_pixels else 0.0
    opaque_pct = (opaque / total_pixels * 100.0) if total_pixels else 0.0
    visible_luma_mean = (visible_luma_sum / visible_pixels) if visible_pixels else 0.0

    if visible_pixels == 0:
        classification = "empty"
    elif black_only and semi_transparent == 0:
        classification = "binary-mask"
    elif black_only:
        classification = "alpha-mask"
    else:
        classification = "tonal-outlier"

    return {
        "width": width,
        "height": height,
        "aspect_ratio": aspect_ratio,
        "transparent_pct": 100.0 - visible_pct,
        "semi_transparent_pct": semi_pct,
        "opaque_pct": opaque_pct,
        "visible_pct": visible_pct,
        "avg_alpha_pct": avg_alpha_pct,
        "bbox_left": left,
        "bbox_top": top,
        "bbox_right": right - 1 if bbox else 0,
        "bbox_bottom": bottom - 1 if bbox else 0,
        "bbox_width": bbox_width,
        "bbox_height": bbox_height,
        "bbox_fill_pct": bbox_fill_pct,
        "visible_luma_mean": visible_luma_mean,
        "visible_luma_max": visible_luma_max,
        "opaque_luma_max": opaque_luma_max,
        "black_only": black_only,
        "unique_alpha_values": len(unique_alpha_values),
        "classification": classification,
    }


def trim_to_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise ValueError("Image has no visible pixels.")
    return image.crop(bbox)


def force_black(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    out = Image.new("RGBA", image.size, (0, 0, 0, 0))
    out.putalpha(alpha)
    return out


def normalize_image(
    image: Image.Image,
    *,
    canvas_size: int,
    safe_fraction: float,
    tone_mode: str,
    scale_adjust: float,
) -> Image.Image:
    trimmed = trim_to_alpha(image.convert("RGBA"))
    if tone_mode == "force_black":
        normalized = force_black(trimmed)
    elif tone_mode == "preserve":
        normalized = trimmed
    else:
        raise ValueError(f"Unsupported tone_mode: {tone_mode}")

    width, height = normalized.size
    longest_side = max(width, height)
    target_longest = max(1, min(canvas_size, round(canvas_size * safe_fraction * scale_adjust)))
    scale = target_longest / longest_side
    resized_width = max(1, round(width * scale))
    resized_height = max(1, round(height * scale))
    resized = normalized.resize((resized_width, resized_height), RESAMPLE)

    master = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset_x = (canvas_size - resized_width) // 2
    offset_y = (canvas_size - resized_height) // 2
    master.alpha_composite(resized, dest=(offset_x, offset_y))
    return master


def write_png(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True, compress_level=9)


def write_report_csv(path: Path, rows: list[dict]) -> None:
    fieldnames = [
        "name",
        "tone_mode",
        "scale_adjust",
        "source_path",
        "source_bytes",
        "source_classification",
        "source_width",
        "source_height",
        "source_aspect_ratio",
        "source_transparent_pct",
        "source_visible_pct",
        "source_semi_transparent_pct",
        "source_opaque_pct",
        "source_avg_alpha_pct",
        "source_bbox_left",
        "source_bbox_top",
        "source_bbox_right",
        "source_bbox_bottom",
        "source_bbox_width",
        "source_bbox_height",
        "source_bbox_fill_pct",
        "source_visible_luma_mean",
        "source_visible_luma_max",
        "source_opaque_luma_max",
        "source_black_only",
        "source_unique_alpha_values",
        "master_path",
        "master_bytes",
        "master_classification",
        "master_width",
        "master_height",
        "master_aspect_ratio",
        "master_transparent_pct",
        "master_visible_pct",
        "master_semi_transparent_pct",
        "master_opaque_pct",
        "master_avg_alpha_pct",
        "master_bbox_left",
        "master_bbox_top",
        "master_bbox_right",
        "master_bbox_bottom",
        "master_bbox_width",
        "master_bbox_height",
        "master_bbox_fill_pct",
        "master_visible_luma_mean",
        "master_visible_luma_max",
        "master_opaque_luma_max",
        "master_black_only",
        "master_unique_alpha_values",
    ]

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_report_markdown(path: Path, rows: list[dict], manifest: dict) -> None:
    lines = [
        "# Resource Icon Audit",
        "",
        f"- Canvas size: `{manifest['canvas_size']}`",
        f"- Safe fraction: `{manifest['safe_fraction']}`",
        f"- Small sizes: `{', '.join(str(size) for size in manifest['small_sizes'])}`",
        "",
        "| Icon | Class | Source | Visible % | Semi % | Max Luma | Master | Master Visible % |",
        "| --- | --- | --- | ---: | ---: | ---: | --- | ---: |",
    ]

    for row in rows:
        source_size = f"{row['source_width']}x{row['source_height']}"
        master_size = f"{row['master_width']}x{row['master_height']}" if row["master_width"] else "-"
        lines.append(
            "| {name} | {cls} | {source_size} | {visible:.2f} | {semi:.2f} | {luma:.2f} | {master_size} | {master_visible:.2f} |".format(
                name=row["name"],
                cls=row["source_classification"],
                source_size=source_size,
                visible=row["source_visible_pct"],
                semi=row["source_semi_transparent_pct"],
                luma=row["source_visible_luma_max"],
                master_size=master_size,
                master_visible=row["master_visible_pct"] or 0.0,
            )
        )

    tonal_outliers = [row for row in rows if row["source_classification"] == "tonal-outlier"]
    if tonal_outliers:
        lines.extend(
            [
                "",
                "## Tonal Outliers",
                "",
            ]
        )
        for row in tonal_outliers:
            lines.append(
                f"- `{row['name']}` had visible luminance up to `{row['source_visible_luma_max']:.2f}` before normalization."
            )

    semi_outliers = [row for row in rows if row["source_semi_transparent_pct"] > 0.0]
    if semi_outliers:
        lines.extend(
            [
                "",
                "## Soft-Edge Icons",
                "",
            ]
        )
        for row in semi_outliers:
            lines.append(
                f"- `{row['name']}` uses `{row['source_semi_transparent_pct']:.2f}%` semi-transparent pixels in the source."
            )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n")


def build_row(
    *,
    entry: dict,
    source_path: Path,
    source_stats: dict,
    master_path: Path | None,
    master_stats: dict | None,
) -> dict:
    row = {
        "name": Path(entry["source"]).name,
        "tone_mode": entry.get("tone_mode", "force_black"),
        "scale_adjust": entry.get("scale_adjust", 1.0),
        "source_path": str(source_path),
        "source_bytes": source_path.stat().st_size,
    }

    for key, value in source_stats.items():
        row[f"source_{key}"] = value

    row["master_path"] = str(master_path) if master_path else ""
    row["master_bytes"] = master_path.stat().st_size if master_path and master_path.exists() else ""

    if master_stats:
        for key, value in master_stats.items():
            row[f"master_{key}"] = value
    else:
        for key in source_stats.keys():
            row[f"master_{key}"] = ""

    return row


def render_outputs(manifest: dict) -> list[dict]:
    cwd = Path.cwd()
    source_dir = resolve_configured_path(manifest["source_dir"], cwd)
    output_dir = resolve_configured_path(manifest["output_dir"], cwd)
    canvas_size = int(manifest["canvas_size"])
    safe_fraction = float(manifest["safe_fraction"])
    small_sizes = [int(size) for size in manifest["small_sizes"]]

    rows = []
    for entry in manifest["items"]:
        source_path = source_dir / entry["source"]
        if not source_path.exists():
            raise FileNotFoundError(f"Missing source image: {source_path}")

        with Image.open(source_path) as source_image:
            source_rgba = source_image.convert("RGBA")
            source_stats = analyze_image(source_rgba)

            tone_mode = entry.get("tone_mode", "force_black")
            scale_adjust = float(entry.get("scale_adjust", 1.0))
            master_image = normalize_image(
                source_rgba,
                canvas_size=canvas_size,
                safe_fraction=safe_fraction,
                tone_mode=tone_mode,
                scale_adjust=scale_adjust,
            )

        master_path = output_dir / "masters" / f"{source_path.stem}.master.png"
        write_png(master_path, master_image)

        for size in small_sizes:
            variant = master_image.resize((size, size), RESAMPLE)
            variant_path = output_dir / str(size) / source_path.name
            write_png(variant_path, variant)

        master_stats = analyze_image(master_image)
        rows.append(
            build_row(
                entry=entry,
                source_path=source_path,
                source_stats=source_stats,
                master_path=master_path,
                master_stats=master_stats,
            )
        )

    report_csv = output_dir / "report.csv"
    report_md = output_dir / "report.md"
    write_report_csv(report_csv, rows)
    write_report_markdown(report_md, rows, manifest)
    return rows


def audit_only(manifest: dict) -> list[dict]:
    cwd = Path.cwd()
    source_dir = resolve_configured_path(manifest["source_dir"], cwd)
    output_dir = resolve_configured_path(manifest["output_dir"], cwd)

    rows = []
    for entry in manifest["items"]:
        source_path = source_dir / entry["source"]
        if not source_path.exists():
            raise FileNotFoundError(f"Missing source image: {source_path}")

        master_path = output_dir / "masters" / f"{source_path.stem}.master.png"
        with Image.open(source_path) as source_image:
            source_stats = analyze_image(source_image)

        master_stats = None
        if master_path.exists():
            with Image.open(master_path) as master_image:
                master_stats = analyze_image(master_image)

        rows.append(
            build_row(
                entry=entry,
                source_path=source_path,
                source_stats=source_stats,
                master_path=master_path if master_path.exists() else None,
                master_stats=master_stats,
            )
        )

    report_csv = output_dir / "report.csv"
    report_md = output_dir / "report.md"
    write_report_csv(report_csv, rows)
    write_report_markdown(report_md, rows, manifest)
    return rows


def main() -> None:
    args = parse_args()
    manifest_path = args.manifest.resolve()
    manifest = load_manifest(manifest_path)

    if args.command == "build":
        rows = render_outputs(manifest)
    else:
        rows = audit_only(manifest)

    print(f"Processed {len(rows)} icons using {manifest_path}.")


if __name__ == "__main__":
    main()
