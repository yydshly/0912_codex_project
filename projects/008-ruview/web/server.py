"""Loopback-only experiment server. Serves public assets and a bounded native computation."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json, math, subprocess, threading

ROOT=Path(__file__).resolve().parent
ENGINE=ROOT/'engine/target/release'/('ruview-lab.exe' if __import__('os').name=='nt' else 'ruview-lab')
GATE=threading.BoundedSemaphore(1)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT/'public'),**kw)
    def payload(self,status,data):
        b=json.dumps(data,ensure_ascii=False,allow_nan=False).encode()
        self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/api/health': return self.payload(200,{'ready':ENGINE.is_file(),'engine':'wifi-densepose-vitals 0.3.2'})
        if u.path!='/api/run': return super().do_GET()
        if not ENGINE.is_file(): return self.payload(503,{'error':'原版计算程序尚未构建，请先运行 bootstrap.py。'})
        q=parse_qs(u.query)
        try:
            vals=[]
            for key,default,lo,hi in [('br',15,6,30),('hr',72,48,120),('noise',.03,0,2),('motion',0,0,3),('channels',56,1,56),('occupied',1,0,1)]:
                v=float(q.get(key,[default])[0])
                if not math.isfinite(v) or not lo<=v<=hi: raise ValueError(key)
                if key in ('channels','occupied') and not v.is_integer(): raise ValueError(key)
                vals.append(str(v))
        except (ValueError,TypeError): return self.payload(400,{'error':'参数超出支持范围。'})
        if not GATE.acquire(blocking=False): return self.payload(429,{'error':'另一项实验正在计算，请稍后重试。'})
        try:
            r=subprocess.run([str(ENGINE),*vals],capture_output=True,text=True,timeout=25,check=True)
            return self.payload(200,json.loads(r.stdout))
        except Exception: return self.payload(500,{'error':'原版计算未完成。请查看本地服务记录。'})
        finally: GATE.release()

if __name__=='__main__':
    print('RuView lab: http://127.0.0.1:8768',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8768),Handler).serve_forever()
