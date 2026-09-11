"""Validate the deployable page, navigation, media and public file boundary."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

root = Path(__file__).resolve().parent / 'dist'
allowed = {'index.html', 'style.css', 'app.js', 'favicon.svg',
           'assets/cafe-demo.mp4', 'assets/pixelle-frame.png', 'assets/wao-canvas.jpg'}
actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
if actual != allowed:
    raise SystemExit(f'Unexpected public file set: {actual ^ allowed}')

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.tabs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                raise ValueError('Duplicate element ID')
            self.ids.add(attrs['id'])
        if attrs.get('role') == 'tab':
            self.tabs.append(attrs.get('data-project'))
        self.links.extend(attrs[key] for key in ('href', 'src', 'poster') if key in attrs)

page = Page()
page.feed((root / 'index.html').read_text(encoding='utf-8'))
if page.tabs != ['pixelle', 'wao', 'huobao', 'toon']:
    raise ValueError('Four project tabs are required')
for link in page.links:
    url = urlsplit(link)
    if url.scheme or url.netloc:
        if url.scheme != 'https':
            raise ValueError(f'Unexpected external URL: {link}')
        continue
    if url.path:
        target = (root / unquote(url.path)).resolve()
        if not target.is_relative_to(root.resolve()) or not target.is_file():
            raise ValueError(f'Missing or non-portable resource: {link}')
    elif url.fragment and url.fragment not in page.ids:
        raise ValueError(f'Missing navigation anchor: {link}')
print(f'Checked four project tabs, {len(page.links)} links and {len(actual)} public files.')
