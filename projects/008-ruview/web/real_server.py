"""Local-only visual monitor for genuine Windows WiFi readings."""
import argparse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import json
from pathlib import Path
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "real-wifi"))
from web_session import LiveSession, verified_replay


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "public"), **kwargs)

    def log_message(self, *args):
        pass

    def payload(self, status, data):
        body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            self.send_response(302)
            self.send_header("Location", "/live.html")
            self.end_headers()
            return
        if path == "/api/live/state":
            return self.payload(200, self.server.session.snapshot())
        if path == "/api/live/replay":
            try:
                return self.payload(200, verified_replay())
            except Exception:
                return self.payload(404, {"error": "找不到已校验的历史实测记录。实时采集仍可使用。"})
        if path.startswith("/api/"):
            return self.payload(404, {"error": "未知接口"})
        return super().do_GET()

    def do_POST(self):
        # Mutations require the actual loopback origin and a non-simple header.
        # A third-party webpage cannot silently start sensor collection.
        origin = f"http://127.0.0.1:{self.server.server_port}"
        if (self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}"
                or self.headers.get("Origin") != origin
                or self.headers.get("X-RuView-Local") != "1"):
            return self.payload(403, {"error": "请从本机实时监测页面操作。"})
        path = urlparse(self.path).path
        if path == "/api/live/start":
            return self.payload(200, self.server.session.start())
        if path == "/api/live/stop":
            return self.payload(200, self.server.session.stop())
        return self.payload(404, {"error": "未知操作"})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8770)
    parser.add_argument("--interface", default="WLAN")
    args = parser.parse_args()
    session = LiveSession(args.interface)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    server.session = session
    session.start()
    print(f"RuView real WiFi: http://127.0.0.1:{args.port}/live.html", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        session.stop()
        server.server_close()
