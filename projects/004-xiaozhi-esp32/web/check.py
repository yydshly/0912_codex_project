"""Validate generated links, anchors and images without browser automation."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re
import xml.etree.ElementTree as ET
import markdown

WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
REPO = PROJECT.parents[1]
OUT = WEB / 'dist'
errors = []

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs = []
        self.ids = []
        self.images = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.refs.append(attrs[key])
        if tag == 'img':
            self.images.append(attrs)

pages = {p.resolve(): Page(p.read_text(encoding='utf-8')) for p in OUT.rglob('*.html')}
ref_count = 0
for file, page in pages.items():
    if len(page.ids) != len(set(page.ids)):
        errors.append(f'Duplicate IDs: {file}')
    for image in page.images:
        if not image.get('alt', '').strip():
            errors.append(f'Missing alt: {file}')
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc:
            continue
        target = (file.parent / unquote(parsed.path)).resolve() if parsed.path else file
        ref_count += 1
        if not target.is_relative_to(OUT.resolve()):
            errors.append(f'Reference escapes site: {file}: {ref}')
        elif not target.exists():
            errors.append(f'Missing reference: {file}: {ref}')
        elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
            errors.append(f'Missing anchor: {file}: {ref}')

sources = [p for p in PROJECT.rglob('*.md') if not p.is_relative_to(OUT)] + [REPO / 'README.md', REPO / 'docs/DEPLOYMENT.md']
source_refs = 0
for file in sources:
    page = Page(markdown.markdown(file.read_text(encoding='utf-8'), extensions=['tables', 'fenced_code']))
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        source_refs += 1
        target = (file.parent / unquote(parsed.path)).resolve()
        if not target.exists():
            errors.append(f'Missing document reference: {file}: {ref}')

for diagram in (PROJECT / 'assets').glob('*.svg'):
    ET.parse(diagram)
root_text = (REPO / 'README.md').read_text(encoding='utf-8')
numbers = re.findall(r'^\| (\d{3}) \|', root_text, re.M)
if numbers != sorted(set(numbers)) or '004' not in numbers:
    errors.append('Root index must contain unique ascending project numbers including 004')
manifest = json.loads((WEB / '.openai/hosting.json').read_text(encoding='utf-8'))
if manifest['static']['directory'] != 'dist':
    errors.append('Unexpected static output directory')
result = {'html_pages': len(pages), 'local_web_references': ref_count, 'markdown_files': len(sources), 'local_document_references': source_refs, 'errors': errors}
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
