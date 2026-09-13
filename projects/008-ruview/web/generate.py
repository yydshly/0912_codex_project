"""Record deterministic, genuine upstream results for a fully static replay."""
import json, subprocess, sys
from pathlib import Path
from server import ROOT, ENGINE
PRESETS={
    'rest':(15,72,.03,0,56,1),
    'fast':(24,96,.03,0,56,1),
    'motion':(15,72,.15,1.5,56,1),
    'single':(15,72,.03,0,1,1),
    'empty':(15,72,0,0,56,0),
}
if __name__=='__main__':
    out=ROOT/'public/data'; out.mkdir(parents=True,exist_ok=True)
    summary=[]
    for name,args in PRESETS.items():
        run=subprocess.run([str(ENGINE),*map(str,args)],capture_output=True,text=True,check=True,timeout=30)
        data=json.loads(run.stdout)
        data['preset']=name
        (out/f'{name}.json').write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n',encoding='utf-8')
        summary.append({'preset':name,'result':data['result'],'elapsed_ms':data['elapsed_ms'],'frames_displayed':len(data['series'])})
    (ROOT.parent/'notes/experiment-results.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(summary,indent=2))
