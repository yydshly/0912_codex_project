"""Build the OpenMAIC research site and linked documents from tracked sources."""
from pathlib import Path
from html import escape, unescape
from urllib.parse import unquote, urlsplit
import os
import re
import shutil
import subprocess
import markdown

WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
REPO = PROJECT.parents[1]
OUT = WEB / 'dist'
ROUTES = {
    PROJECT / 'README.md': 'docs/research.html',
    PROJECT / 'notes/README.md': 'docs/notes.html',
    PROJECT / 'notes/01-architecture.md': 'docs/architecture.html',
    PROJECT / 'notes/02-effects-and-roadmap.md': 'docs/roadmap.html',
    PROJECT / 'notes/03-validation.md': 'docs/validation.html',
    PROJECT / 'notes/04-comparison.md': 'docs/comparison.html',
    PROJECT / 'notes/05-case-study.md': 'docs/case-study.html',
    PROJECT / 'notes/06-module-principles.md': 'docs/module-principles.html',
    PROJECT / 'notes/07-understanding.md': 'docs/understanding.html',
    PROJECT / 'assets/README.md': 'docs/assets.html',
    WEB / 'README.md': 'docs/web.html',
    WEB / 'validation.md': 'docs/web-validation.html',
}
if OUT.is_symlink() or OUT.resolve() != WEB.resolve() / 'dist':
    raise ValueError('Unexpected output location')
OUT.mkdir(exist_ok=True)
for source in (WEB / 'public').iterdir():
    if source.is_file():
        shutil.copy2(source, OUT / source.name)
(OUT / 'assets').mkdir(exist_ok=True)
for source in (PROJECT / 'assets').iterdir():
    if source.is_file() and source.suffix != '.md':
        shutil.copy2(source, OUT / 'assets' / source.name)

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
        elif resolved in [WEB / 'dist/index.html', WEB / 'dist/case.html']:
            target = OUT / resolved.name
        elif resolved.is_relative_to(REPO):
            relative = resolved.relative_to(REPO).as_posix()
            url = 'https://github.com/yydshly/0912_codex_project'
            if relative != 'README.md':
                url += '/blob/main/' + relative
            return attr + '="' + escape(url, quote=True) + '"'
        else:
            raise ValueError('Unmapped reference: ' + value)
        url = Path(os.path.relpath(target, output.parent)).as_posix()
        if parsed.fragment:
            url += '#' + parsed.fragment
        return attr + '="' + escape(url, quote=True) + '"'
    return re.sub(r'(href|src)="([^"]+)"', replace, html)

for source, route in ROUTES.items():
    text = source.read_text(encoding='utf-8-sig')
    # The overview image is the browser-friendly companion to the source Mermaid.
    text = re.sub(r'```mermaid[\s\S]*?```', '流程图见下方原创能力图；精确模块关系见正文。\n\n![OpenMAIC 能力与流程图](../assets/capability-map.svg)', text)
    converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists'])
    article = converter.convert(text)
    article = article.replace('<table>', '<div class="table-scroll" role="region" aria-label="可横向滚动的资料表" tabindex="0"><table>').replace('</table>', '</table></div>')
    output = OUT / route
    article = rewrite_links(article, source, output)
    title = escape(text.splitlines()[0].lstrip('# '))
    page = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' · OpenMAIC 研究</title><link rel="stylesheet" href="../styles.css"></head><body><main class="doc-page"><a href="../index.html">← 返回 OpenMAIC 能力展示</a><article>' + article + '</article></main></body></html>'
    output.parent.mkdir(exist_ok=True)
    output.write_text(page, encoding='utf-8')
subprocess.run(['node', str(WEB / 'build-case.mjs')], cwd=WEB, check=True)
print('Built OpenMAIC: 1 showcase + 1 interactive case + 1 generation lab + ' + str(len(ROUTES)) + ' reference pages')
