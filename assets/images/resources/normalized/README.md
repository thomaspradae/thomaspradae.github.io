# Resource Icon Pipeline

The original PNGs in `assets/images/resources/` remain untouched.

This folder contains generated assets:

- `masters/*.master.png` and `masters/*.master.webp`: normalized square masters on a shared canvas
- `10/`, `16/`, `24/`, `32/`, `64/`: small raster exports derived from the masters, written as both PNG and WebP
- `report.csv`: detailed audit data for source and generated assets
- `report.md`: quick human-readable summary
- `manifest.json`: the source list and normalization settings

To rebuild everything:

```bash
python3 scripts/resource_icon_pipeline.py build
```

That command is additive by default: it keeps existing rendered assets and only creates missing files.

To rebuild and overwrite the generated assets:

```bash
python3 scripts/resource_icon_pipeline.py build --force
```

To refresh the reports without re-rendering:

```bash
python3 scripts/resource_icon_pipeline.py audit
```

The most important manifest knobs are:

- `canvas_size`: shared square master size
- `safe_fraction`: how much of the square the icon can occupy
- `formats`: which output formats to render
- `tone_mode`: `force_black` standardizes the icon to black plus alpha
- `scale_adjust`: per-icon visual-weight tweak without changing the source file
