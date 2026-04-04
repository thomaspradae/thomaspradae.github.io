# Resource Icon Pipeline

The original PNGs in `assets/images/resources/` remain untouched.

This folder contains generated assets:

- `masters/*.master.png`: normalized square masters on a shared canvas
- `10/*.png`, `16/*.png`, `24/*.png`, `32/*.png`: small raster exports derived from the masters
- `report.csv`: detailed audit data for source and generated assets
- `report.md`: quick human-readable summary
- `manifest.json`: the source list and normalization settings

To rebuild everything:

```bash
python3 scripts/resource_icon_pipeline.py build
```

To refresh the reports without re-rendering:

```bash
python3 scripts/resource_icon_pipeline.py audit
```

The most important manifest knobs are:

- `canvas_size`: shared square master size
- `safe_fraction`: how much of the square the icon can occupy
- `tone_mode`: `force_black` standardizes the icon to black plus alpha
- `scale_adjust`: per-icon visual-weight tweak without changing the source file
