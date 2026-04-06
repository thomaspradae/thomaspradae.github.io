import re
from pathlib import Path

POSTS_DIRS = ["_building", "_notes", "_writing", "_marginalia"]

for folder in POSTS_DIRS:
    for path in Path(folder).rglob("*.md"):
        content = path.read_text(encoding="utf-8")

        new_content = re.sub(
            r'^\s*class="highlight">\s*$',
            '',
            content,
            flags=re.MULTILINE
        )

        new_content = new_content.replace('class="highlight">', '')

        if new_content != content:
            path.write_text(new_content, encoding="utf-8")
            print(f"Fixed: {path}")