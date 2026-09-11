"""Build the reading site from the canonical project README; no backend or secrets."""
from pathlib import Path
from html import escape, unescape
from urllib.parse import urlsplit, unquote
import os
import re
import shutil
import markdown

WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
REPO = PROJECT.parents[1]
OUT = WEB / 'dist'
ROUTES = {
    PROJECT / 'README.md': 'index.html',
    WEB / 'README.md': 'docs/web.html',
    PROJECT / 'assets/README.md': 'docs/assets.html',
    PROJECT / 'notes/README.md': 'docs/notes.html',
    WEB / 'validation.md': 'docs/validation.html',
    REPO / 'docs/DEPLOYMENT.md': 'docs/deployment.html',
}

def rewrite_links(html, source, output):
    def replace(match):
        attr, value = match.groups()
        parsed = urlsplit(unescape(value))
        if parsed.scheme or parsed.netloc or not parsed.path:
            return match.group(0)
        resolved = (source.parent / unquote(parsed.path)).resolve()
        if resolved in ROUTES:
            target = OUT / ROUTES[resolved]
        elif resolved.is_relative_to(PROJECT / 'assets'):
            target = OUT / 'assets' / resolved.relative_to(PROJECT / 'assets')
        elif resolved.is_relative_to(REPO):
            repo_path = resolved.relative_to(REPO).as_posix()
            remote = 'https://github.com/yydshly/0912_codex_project' if repo_path == 'README.md' else 'https://github.com/yydshly/0912_codex_project/blob/main/' + repo_path
            return f'{attr}="{escape(remote, quote=True)}"'
        else:
            raise ValueError(f'Unmapped local reference: {source}: {value}')
        link = Path(os.path.relpath(target, output.parent)).as_posix()
        if parsed.fragment:
            link += '#' + parsed.fragment
        return f'{attr}="{escape(link, quote=True)}"'
    return re.sub(r'(href|src)="([^"]+)"', replace, html)

OUT.mkdir(exist_ok=True)
for source, route in ROUTES.items():
    if not source.exists():
        continue
    converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists'], extension_configs={'toc': {'toc_depth': '2-3'}})
    article = converter.convert(source.read_text(encoding='utf-8'))
    article = article.replace('<table>', '<div class="table-scroll"><table>').replace('</table>', '</table></div>')
    output = OUT / route
    article = rewrite_links(article, source, output)
    if route == 'index.html':
        template = (WEB / 'template.html').read_text(encoding='utf-8')
        page = template.replace('<!--TOC-->', converter.toc).replace('<!--ARTICLE-->', article)
    else:
        title = escape(source.read_text(encoding='utf-8').splitlines()[0].lstrip('# '))
        page = f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} · 小智研究</title><link rel="stylesheet" href="../styles.css"></head><body><header><a href="../index.html">← 返回小智 ESP32 研究</a></header><main><article>{article}</article></main></body></html>'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding='utf-8')
for name in ['styles.css', 'app.js']:
    shutil.copy2(WEB / name, OUT / name)
for asset in (PROJECT / 'assets').iterdir():
    if asset.is_file() and asset.suffix != '.md':
        (OUT / 'assets').mkdir(exist_ok=True)
        shutil.copy2(asset, OUT / 'assets' / asset.name)
print(f'Built {OUT / "index.html"}')
