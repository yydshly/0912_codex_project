"""Fetch the fixed upstream crate unchanged, then build the local adapter.
Only the selected MIT crate is cached in ignored .upstream; no upstream checkout is committed.
"""
from pathlib import Path
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, subprocess

ROOT=Path(__file__).resolve().parent
COMMIT='33a9e90896a691a3f98de042b463e5945178b87c'
BASE=f'https://raw.githubusercontent.com/ruvnet/RuView/{COMMIT}/'
FILES=['LICENSE','v2/crates/wifi-densepose-vitals/Cargo.toml','v2/crates/wifi-densepose-vitals/README.md'] + [f'v2/crates/wifi-densepose-vitals/src/{n}.rs' for n in ['lib','anomaly','breathing','groundtruth','heartrate','preprocessor','store','types']] + [f'v2/crates/wifi-densepose-vitals/benches/{n}.rs' for n in ['vitals_bench','groundtruth_bench']]

def fetch(rel):
    p=ROOT/'.upstream/RuView'/rel
    with urlopen(Request(BASE+rel,headers={'User-Agent':'RuView-research-lab'}),timeout=60) as r: data=r.read()
    digest=hashlib.sha256(data).hexdigest()
    lock=ROOT/'upstream-lock.json'
    if lock.exists():
        expected=json.loads(lock.read_text(encoding='utf-8'))
        if expected['commit']!=COMMIT: raise ValueError('Upstream commit differs from lock')
        known={f['path']:f['sha256'] for f in expected['files']}
        if known.get(rel)!=digest: raise ValueError(f'Upstream hash mismatch: {rel}')
    p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(data)
    return {'path':rel,'sha256':digest}

if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=6) as pool: manifest=list(pool.map(fetch,FILES))
    (ROOT/'upstream-lock.json').write_text(json.dumps({'commit':COMMIT,'files':manifest},indent=2)+'\n',encoding='utf-8')
    (ROOT/'.upstream/RuView/v2/Cargo.toml').write_text('''[workspace]
members = ["crates/wifi-densepose-vitals"]
resolver = "2"
[workspace.package]
edition = "2021"
license = "MIT"
repository = "https://github.com/ruvnet/RuView"
[workspace.dependencies]
tracing = "0.1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
''',encoding='utf-8')
    subprocess.run(['cargo','build','--release','--locked','--manifest-path',str(ROOT/'engine/Cargo.toml')],check=True)
