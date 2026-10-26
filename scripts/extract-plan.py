"""One-time import of the supplied plan; does not modify the source document."""
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

source = Path(sys.argv[1])
destination = Path(__file__).resolve().parents[1] / 'src' / 'data'
destination.mkdir(parents=True, exist_ok=True)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(source) as archive:
    root = ET.fromstring(archive.read('word/document.xml'))
lines = [''.join(p.itertext()) for p in []]
lines = [''.join(t.text or '' for t in p.findall('.//w:t', ns)) for p in root.findall('.//w:p', ns)]
names = ['Larry DeSantis', 'Donna DeSantis', 'Sherée Bergman', 'Darren Bergman', 'Bhumika Bergman']
people = []
start = lines.index('Larry DeSantis', lines.index('Accessibility and validation checklist'))
for i, name in enumerate(names):
    first = lines.index(name, start)
    last = lines.index(names[i + 1], first + 1) if i < 4 else lines.index('About: page-specific SEO / schema', first)
    section = [line for line in lines[first:last] if line.strip()]
    full = section.index('FULL BIOGRAPHY')
    people.append({'id': name.split()[0].lower().replace('é', 'e'), 'name': name,
                   'intro': section[section.index('CARD INTRODUCTION') + 1], 'bio': section[full + 1:]})
(destination / 'people.json').write_text(json.dumps(people, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Imported {len(people)} complete biographies from {source.name}')
