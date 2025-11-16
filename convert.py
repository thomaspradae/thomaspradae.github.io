# convert_px_to_rem.py
import re
from pathlib import Path

# Path to your CSS file
path = Path("fugg2.css")

css = path.read_text(encoding="utf-8")

def px_to_rem(match):
    value = float(match.group(1))      # the numeric part
    rem = value / 16.0                 # 16px = 1rem
    # format nicely, no trailing zeros
    formatted = f"{rem:.4f}".rstrip("0").rstrip(".")
    return f"{formatted}rem"

# replace `Npx` (N can be decimal) with `Xrem`
new_css = re.sub(r"(\d+(\.\d+)?)px", px_to_rem, css)

path.write_text(new_css, encoding="utf-8")

print("Done. All px → rem.")
