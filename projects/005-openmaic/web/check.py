"""Check the static delivery contract, local references and document navigation."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re

OUT = Path(__file__).resolve().parent / 'dist'
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs, self.ids, self.images, self.buttons = [], [], [], []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        for key in ['href', 'src']:
            if attrs.get(key): self.refs.append(attrs[key])
        if tag == 'img': self.images.append(attrs)
        if 'data-capability' in attrs: self.buttons.append(attrs['data-capability'])
pages = {p.resolve(): Page(p.read_text(encoding='utf-8')) for p in OUT.rglob('*.html')}
errors = []
count = 0
for file, page in pages.items():
    if len(page.ids) != len(set(page.ids)): errors.append('Duplicate IDs: ' + str(file))
    for img in page.images:
        if not img.get('alt', '').strip(): errors.append('Missing alt: ' + str(file))
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc: continue
        count += 1
        target = (file.parent / unquote(parsed.path)).resolve() if parsed.path else file
        if not target.is_relative_to(OUT.resolve()) or not target.exists():
            errors.append('Missing or escaping link: ' + str(file) + ' -> ' + ref)
        elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
            errors.append('Missing anchor: ' + ref)
home = pages.get((OUT/'index.html').resolve())
if not home or set(home.buttons) != {'interactive','lecture','discussion','quiz','pbl','workbench'}:
    errors.append('Incomplete capability navigation')
js = (OUT/'app.js').read_text(encoding='utf-8')
for asset in re.findall(r"'(assets/[^']+)'", js):
    if not (OUT/asset).is_file(): errors.append('Missing dynamic asset: ' + asset)
if len(pages) != 15: errors.append('Expected showcase, interactive case, generation lab and 12 reference pages')
for required in ['styles.css','app.js','case.html','case.css','case-app.js','generation.html','generation.css','generation-app.js','case-sdk.css','case-dependencies-LICENSE.txt','assets/UPSTREAM-LICENSE.txt']:
    if not (OUT/required).is_file(): errors.append('Missing file: ' + required)
print({'pages':len(pages), 'local_references':count, 'errors':errors})
if errors: raise SystemExit(1)
