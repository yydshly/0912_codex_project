"""Assemble the standalone static reading page without third-party dependencies."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
DIST.mkdir(exist_ok=True)
for name in ('index.html', 'styles.css'):
    shutil.copy2(ROOT / name, DIST / name)
for folder in ('assets', 'documents'):
    (DIST / folder).mkdir(exist_ok=True)
for name in ('core-flow-architecture.svg', 'capability-architecture.svg'):
    shutil.copy2(ROOT.parent / 'assets' / name, DIST / 'assets' / name)
for name in ('understanding.md', 'architecture.md'):
    # Export a standalone document whose relative images also resolve in the site.
    content = (ROOT.parent / 'notes' / name).read_text(encoding='utf-8')
    content = content.replace('core-flow-architecture.png', 'core-flow-architecture.svg')
    content = content.replace('capability-architecture.png', 'capability-architecture.svg')
    content = content.replace('(../README.md)', '(../index.html)')
    (DIST / 'documents' / name).write_text(content, encoding='utf-8')
print(f'Static page assembled: {DIST}')
