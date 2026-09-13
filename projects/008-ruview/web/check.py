"""Verify upstream provenance, native replay, numerical controls, resources and API."""
from html.parser import HTMLParser
from urllib.parse import urlparse
from urllib.request import urlopen
from urllib.error import HTTPError
import hashlib, json, subprocess
from generate import PRESETS
from server import ROOT, ENGINE

def main():
    manifest=json.loads((ROOT/'upstream-lock.json').read_text())
    for f in manifest['files']:
        assert hashlib.sha256((ROOT/'.upstream/RuView'/f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
    class Links(HTMLParser):
        def handle_starttag(self,tag,attrs):
            for k,v in attrs:
                if k in ('src','href') and v and not urlparse(v).scheme and not v.startswith('#'):
                    assert (ROOT/'public'/v).exists(),v
    for html in (ROOT/'public').glob('*.html'):
        Links().feed(html.read_text(encoding='utf-8'))
    results={}
    for name,args in PRESETS.items():
        d=json.loads(subprocess.check_output([str(ENGINE),*map(str,args)],text=True,timeout=30))
        saved=json.loads((ROOT/f'public/data/{name}.json').read_text())
        for field in ('input','result','series','heatmap','commit','evidence'): assert d[field]==saved[field],(name,field)
        assert d['series'][-1]['breathing']==d['result']['breathing']
        assert d['series'][-1]['heart']==d['result']['heart']
        assert len(d['series'])==226
        results[name]=d['result']
    assert abs(results['rest']['breathing']['bpm']-15)<.5
    assert abs(results['rest']['heart']['bpm']-72)<3
    assert results['empty']=={'breathing':None,'heart':None}
    assert results['single']['heart']['status']=='Unreliable'
    assert abs(results['motion']['heart']['bpm']-72)>15
    with urlopen('http://127.0.0.1:8768/api/run?br=18&hr=84') as r: custom=json.load(r)
    assert custom['input']['breathing']==18 and custom['input']['heart']==84
    for bad in ('br=nan','br=999','channels=1.5','occupied=0.5'):
        try: urlopen('http://127.0.0.1:8768/api/run?'+bad)
        except HTTPError as e: assert e.code==400
        else: raise AssertionError(bad)
    print('PASS: source hashes, five deterministic native replays, numerical controls, resource links, custom API and invalid input rejection.')

if __name__=='__main__': main()
