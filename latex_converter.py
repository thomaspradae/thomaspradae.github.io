import re
import os

def convert_file(file_path):
    print(f"Processing file: {file_path}")  
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    noconvert_sections = []

    def extract_noconvert(match):
        noconvert_sections.append(match.group(0))
        return f"<!-- noconvert_placeholder_{len(noconvert_sections)-1} -->"

    content = re.sub(r'<!-- noconvert -->(.*?)<!-- /noconvert -->', extract_noconvert, content, flags=re.DOTALL)

    content = re.sub(r'\$\$(.+?)\$\$', r'\\\\[ \1 \\\\]', content)
    content = re.sub(r'\$(.+?)\$', r'\\\\( \1 \\\\)', content)

    def insert_noconvert(match):
        index = int(match.group(1))
        return noconvert_sections[index]

    content = re.sub(r'<!-- noconvert_placeholder_(\d+) -->', insert_noconvert, content)

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

def main():
    base_path = os.getcwd()
    folders = ['_building', '_notes', '_writing', '_misc']
    print(f"Base path: {base_path}")
    for folder in folders:
        full_path = os.path.join(base_path, folder)
        print(f"Checking folder: {full_path}")
        for root, dirs, files in os.walk(full_path):
            for file in files:
                if file.endswith('.md'):
                    convert_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
