import re
from pathlib import Path


POST_FOLDERS = ("_building", "_notes", "_writing", "_marginalia")
PLACEHOLDER_TEMPLATE = "@@CODEX_LATEX_PLACEHOLDER_{}@@"

LINK_PATTERN = re.compile(
    r"\[([^\]]+)\]\(\.\./_(\w+)/\d{4}-\d{2}-\d{2}-(.+?)\.md#?\)"
)
NO_CONVERT_PATTERN = re.compile(
    r"<!-- noconvert -->(.*?)<!-- /noconvert -->", re.DOTALL
)
FENCED_CODE_PATTERN = re.compile(r"```[\s\S]*?```|~~~[\s\S]*?~~~")
INLINE_CODE_PATTERN = re.compile(r"`[^`\n]*`")

DISPLAY_DOLLAR_PATTERN = re.compile(r"(?s)(?<!\\)\$\$(.+?)(?<!\\)\$\$")
DISPLAY_BRACKET_PATTERN = re.compile(r"(?s)(?<!\\)\\+\[(.+?)(?<!\\)\\+\]")

INLINE_DOLLAR_PATTERN = re.compile(r"(?<!\\)\$(?!\$)([^\n$]+?)(?<!\\)\$(?!\$)")
INLINE_PAREN_PATTERN = re.compile(r"(?<!\\)\\+\((.+?)(?<!\\)\\+\)")

CURRENCY_INLINE_MATH_PATTERN = re.compile(
    r"\\\$\s*\\\\\(\s*([0-9][0-9.,]*)\s*\\\\\)"
)
PURE_INLINE_MATH_PATTERN = re.compile(r"^\s*(?:\\+\(.+?\\+\)|\\+\[.+?\\+\])\s*$")
TABLE_DIVIDER_PATTERN = re.compile(
    r"^\s*\|?(?:\s*:?-{3,}:?\s*\|)+(?:\s*:?-{3,}:?\s*)\|?\s*$"
)


def convert_links(text):
    def replace_link(match):
        label = match.group(1)
        folder = match.group(2)
        filename = match.group(3)
        return f"[{label}](/{folder}/{filename})"

    return LINK_PATTERN.sub(replace_link, text)


def protect_sections(text, pattern, sections):
    def replace(match):
        sections.append(match.group(0))
        return PLACEHOLDER_TEMPLATE.format(len(sections) - 1)

    return pattern.sub(replace, text)


def restore_sections(text, sections):
    def replace(match):
        index = int(match.group(1))
        return sections[index]

    return re.sub(
        PLACEHOLDER_TEMPLATE.replace("{}", r"(\d+)"),
        replace,
        text,
    )


def protect_front_matter(text, sections):
    if not text.startswith("---\n"):
        return text

    end = text.find("\n---\n", 4)
    if end == -1:
        return text

    front_matter = text[: end + len("\n---\n")]
    sections.append(front_matter)
    return PLACEHOLDER_TEMPLATE.format(len(sections) - 1) + text[end + len("\n---\n") :]


def normalize_math_body(body):
    return body.strip().replace("|", "&#124;")


def format_display(body):
    return f"\\\\[{normalize_math_body(body)}\\\\]"


def format_inline(body):
    return f"\\\\({normalize_math_body(body)}\\\\)"


def normalize_math(text):
    text = DISPLAY_DOLLAR_PATTERN.sub(lambda m: format_display(m.group(1)), text)
    text = DISPLAY_BRACKET_PATTERN.sub(lambda m: format_display(m.group(1)), text)

    text = INLINE_DOLLAR_PATTERN.sub(lambda m: format_inline(m.group(1)), text)
    text = INLINE_PAREN_PATTERN.sub(lambda m: format_inline(m.group(1)), text)

    # Repair old escaped-currency cases like `\$\(45\)` -> `\$45`.
    text = CURRENCY_INLINE_MATH_PATTERN.sub(r"\\$\1", text)

    return text


def split_table_row(line):
    stripped = line.strip()
    if "|" not in stripped:
        return None

    if stripped.startswith("|"):
        stripped = stripped[1:]
    if stripped.endswith("|"):
        stripped = stripped[:-1]

    return [cell.strip() for cell in stripped.split("|")]


def join_table_row(cells):
    return "| " + " | ".join(cells) + " |"


def wrap_mathjax_table_headers(text):
    lines = text.splitlines()

    for index in range(len(lines) - 1):
        if not TABLE_DIVIDER_PATTERN.match(lines[index + 1]):
            continue

        header_cells = split_table_row(lines[index])
        divider_cells = split_table_row(lines[index + 1])

        if not header_cells or not divider_cells:
            continue
        if len(header_cells) != len(divider_cells):
            continue

        updated_cells = []
        changed = False

        for cell in header_cells:
            if "table-header-mathjax" in cell:
                updated_cells.append(cell)
                continue

            if PURE_INLINE_MATH_PATTERN.match(cell):
                updated_cells.append(
                    f'<span class="table-header-mathjax">{cell}</span>'
                )
                changed = True
                continue

            updated_cells.append(cell)

        if changed:
            lines[index] = join_table_row(updated_cells)

    return "\n".join(lines)


def convert_file(file_path):
    print(f"Processing file: {file_path}")
    content = file_path.read_text(encoding="utf-8")

    protected_sections = []
    content = protect_front_matter(content, protected_sections)
    content = protect_sections(content, NO_CONVERT_PATTERN, protected_sections)
    content = protect_sections(content, FENCED_CODE_PATTERN, protected_sections)
    content = protect_sections(content, INLINE_CODE_PATTERN, protected_sections)

    content = normalize_math(content)
    content = wrap_mathjax_table_headers(content)
    content = convert_links(content)
    content = restore_sections(content, protected_sections)

    file_path.write_text(content, encoding="utf-8")


def main():
    base_path = Path.cwd()
    print(f"Base path: {base_path}")

    for folder in POST_FOLDERS:
        folder_path = base_path / folder
        print(f"Checking folder: {folder_path}")
        if not folder_path.exists():
            continue

        for file_path in folder_path.rglob("*.md"):
            convert_file(file_path)


if __name__ == "__main__":
    main()
