"""Assemble registered, already-built research sites for GitHub Pages."""
from pathlib import Path
from html import escape
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_site'
entries = json.loads((ROOT / 'docs/web-projects.json').read_text(encoding='utf-8'))
slugs = [entry['slug'] for entry in entries]
if not entries or slugs != sorted(set(slugs)):
    raise ValueError('Register at least one site, in unique numbered order')
sources = []
for entry in entries:
    if not re.fullmatch(r'\d{3}-[a-z0-9-]+', entry['slug']):
        raise ValueError('Invalid project slug')
    if not re.fullmatch(r'https://github\.com/[\w.-]+/[\w.-]+', entry.get('upstream', '')):
        raise ValueError(f"Register the original GitHub repository: {entry['slug']}")
    source = (ROOT / entry['output']).resolve()
    if not source.is_relative_to(ROOT / 'projects') or not (source / 'index.html').is_file():
        raise ValueError(f"Build the registered project first: {entry['slug']}")
    if any(item.is_symlink() for item in source.rglob('*')):
        raise ValueError('Static output must not contain symlinks')
    sources.append(source)

# Only regenerate the exact local _site directory; reject redirected paths.
if OUT.is_symlink() or OUT.resolve() != ROOT / '_site':
    raise ValueError('Unexpected output location')
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
rows = []
for entry, source in zip(entries, sources):
    shutil.copytree(source, OUT / entry['slug'])
    upstream = escape(entry['upstream'])
    repository = escape(entry['upstream'].removeprefix('https://github.com/'))
    rows.append(f'<tr><th scope="row">{escape(entry["title"])}</th>'
                f'<td>{escape(entry["description"])}</td>'
                f'<td><a href="{upstream}">{repository}</a></td>'
                f'<td><a href="{escape(entry["slug"])}/">在线阅读</a></td></tr>')
page = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GitHub 优秀项目研究集 · Web</title><style>body{margin:0;background:#f1f5f9;color:#182c43;font:18px/1.8 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1080px;margin:8vh auto;padding:0 24px}h1{font-size:clamp(30px,5vw,48px)}.eyebrow{color:#075985}.table-scroll{overflow-x:auto;margin:28px 0;background:white;border-top:4px solid #006bce}table{width:100%;border-collapse:collapse;font-size:16px}caption{text-align:left;padding:18px 22px;font-weight:700;font-size:22px}th,td{text-align:left;vertical-align:top;padding:18px 22px;border-bottom:1px solid #d5e0e9;min-width:120px}td:nth-child(2){min-width:240px}td:nth-child(3){min-width:170px}thead{background:#e7eef6}a:focus-visible{outline:3px solid #d78a00}a{color:#006bce}footer{margin-top:60px;font-size:14px}</style></head><body><main><p class="eyebrow">OPEN SOURCE / RESEARCH</p><h1>从源码，理解一个产品。</h1><p>已发布研究页面的有序入口。硬件图解、技术原理与实践过程保存在各项目中，验证边界随文档记录。</p><div class="table-scroll" role="region" aria-label="项目索引表，可横向滚动" tabindex="0"><table><caption>项目索引</caption><thead><tr><th scope="col">研究项目</th><th scope="col">核心定位</th><th scope="col">原始仓库</th><th scope="col">Web 页面</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table></div><footer><a href="https://github.com/yydshly/0912_codex_project">研究仓库与完整索引 ↗</a></footer></main></body></html>'''
(OUT / 'index.html').write_text(page, encoding='utf-8')
(OUT / '.nojekyll').touch()
print(f'Assembled {len(entries)} site(s) at {OUT}')
