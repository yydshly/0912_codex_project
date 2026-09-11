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
cards = []
for entry, source in zip(entries, sources):
    shutil.copytree(source, OUT / entry['slug'])
    cards.append(f'<li><a href="{escape(entry["slug"])}/"><h2>{escape(entry["title"])}</h2>'
                 f'<p>{escape(entry["description"])}</p><span>阅读研究与引导图 →</span></a></li>')
page = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GitHub 优秀项目研究集 · Web</title><style>body{margin:0;background:#f1f5f9;color:#182c43;font:18px/1.8 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1080px;margin:8vh auto;padding:0 24px}h1{font-size:clamp(30px,5vw,48px)}.eyebrow{color:#075985}ul{list-style:none;padding:0}li{margin:28px 0;background:white;border-top:4px solid #006bce;border-radius:4px}li a{display:block;padding:22px 28px;color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #d78a00}h2{margin:0;font-size:27px}a{color:#006bce}span{color:#006bce}footer{margin-top:60px;font-size:14px}</style></head><body><main><p class="eyebrow">OPEN SOURCE / RESEARCH</p><h1>从源码，理解一个产品。</h1><p>已发布研究页面的有序入口。硬件图解、技术原理与实践过程保存在各项目中，验证边界随文档记录。</p><ul>'''+''.join(cards)+'''</ul><footer><a href="https://github.com/yydshly/0912_codex_project">研究仓库与完整索引 ↗</a></footer></main></body></html>'''
(OUT / 'index.html').write_text(page, encoding='utf-8')
(OUT / '.nojekyll').touch()
print(f'Assembled {len(entries)} site(s) at {OUT}')
