"""Compare the deployed static files with a freshly assembled local site."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '_site'
BASE = 'https://yydshly.github.io/0912_codex_project/'
files = [p for p in OUT.rglob('*') if p.is_file() and not p.name.startswith('.')]
if not files:
    raise SystemExit('Build and assemble the site before checking deployment')

def digest(data, suffix):
    # Git normalizes text to LF; Windows local builds may contain CRLF.
    if suffix in {'.html', '.css', '.js', '.svg', '.txt', '.json'}:
        data = data.replace(b'\r\n', b'\n')
    return hashlib.sha256(data).hexdigest()

def check(file):
    relative = file.relative_to(OUT).as_posix()
    request = Request(BASE + quote(relative), headers={'User-Agent': 'research-pages-verification'})
    try:
        with urlopen(request, timeout=30) as response:
            actual = response.read()
            if response.status != 200:
                raise ValueError(f'HTTP {response.status}')
            if digest(actual, file.suffix) != digest(file.read_bytes(), file.suffix):
                raise ValueError('Remote content differs from the local build')
        return {'path': relative, 'status': 'pass'}
    except Exception as error:
        return {'path': relative, 'status': 'fail', 'error': str(error)}

with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, files))
failed = [result for result in results if result['status'] != 'pass']
print(json.dumps({'base_url': BASE, 'checked_files': len(results), 'failed': failed}, ensure_ascii=False, indent=2))
sys.exit(bool(failed))
