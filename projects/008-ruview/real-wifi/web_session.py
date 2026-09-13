"""Bounded real WiFi collection shared by the local visual monitor."""
from collections import deque
from datetime import datetime
import json
import threading
import time

from monitor import ROOT, collect, load_upstream


class LiveSession:
    def __init__(self, interface="WLAN", duration=180):
        self.interface, self.duration = interface, duration
        self.lock = threading.RLock()
        self.stop_event = threading.Event()
        self.thread = None
        self.state = "idle"
        self.error = None
        self.samples, self.reports = [], []
        self.started_at = None
        self.session_id = None
        self.revision = 0
        self.upstream_lock, self.modules = load_upstream()

    def start(self):
        with self.lock:
            if self.thread and self.thread.is_alive():
                return self.snapshot()
            self.samples, self.reports = [], []
            self.error, self.started_at = None, time.time()
            self.session_id = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
            self.state = "starting"
            self.revision += 1
            self.stop_event = threading.Event()
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
            return self.snapshot()

    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=6)
        return self.snapshot()

    def snapshot(self):
        with self.lock:
            return {
                "source": "real-windows-netsh-rssi", "mode": "live",
                "session_id": self.session_id, "state": self.state, "error": self.error,
                "interface": self.interface, "started_at": self.started_at,
                "server_time": time.time(), "duration_seconds": self.duration,
                "revision": self.revision, "upstream_commit": self.upstream_lock["commit"],
                "ground_truth": "unverified", "window_seconds": 15,
                "presence_variance_threshold": 0.3, "motion_energy_threshold": 0.05,
                "samples": list(self.samples), "reports": list(self.reports),
            }

    def _run(self):
        Sample = self.modules["rssi_collector"].WifiSample
        extractor = self.modules["feature_extractor"].RssiFeatureExtractor(window_seconds=15)
        classifier = self.modules["classifier"].PresenceClassifier(
            presence_variance_threshold=0.3, motion_energy_threshold=0.05,
        )
        window = deque(maxlen=60)
        begin, last_report = time.monotonic(), 0.0
        directory = ROOT / "recordings"
        try:
            directory.mkdir(exist_ok=True)
            with (directory / f"{self.session_id}-web.jsonl").open("x", encoding="utf-8") as stream:
                def save(row):
                    stream.write(json.dumps(row, ensure_ascii=False, allow_nan=False) + "\n")
                    stream.flush()
                metadata = self.snapshot()
                save({k: v for k, v in {**metadata, "type": "metadata"}.items() if k not in ("samples", "reports")})
                while not self.stop_event.is_set() and time.monotonic() - begin < self.duration:
                    tick = time.monotonic()
                    timestamp, rssi = collect(self.interface)
                    if self.stop_event.is_set():
                        break
                    elapsed = time.monotonic() - begin
                    sample = {"timestamp": timestamp, "elapsed_seconds": round(elapsed, 3), "rssi_dbm": rssi}
                    window.append(Sample(timestamp, rssi, None, None, None, None, None, self.interface))
                    report = None
                    if elapsed >= 15 and elapsed - last_report >= 3:
                        features = extractor.extract(list(window))
                        result = classifier.classify(features)
                        report = {
                            "timestamp": timestamp, "elapsed_seconds": round(elapsed, 3),
                            "window_samples": features.n_samples, "sample_rate_hz": features.sample_rate_hz,
                            "mean_dbm": features.mean, "variance": features.variance,
                            "motion_energy": features.motion_band_power,
                            "upstream_label": result.motion_level.value, "upstream_score": result.confidence,
                        }
                        last_report = elapsed
                    save({"type": "sample", **sample})
                    if report:
                        save({"type": "classification", **report})
                    with self.lock:
                        self.samples.append(sample)
                        if report:
                            self.reports.append(report)
                        self.state = "collecting"
                        self.revision += 1
                    self.stop_event.wait(max(0, .5 - (time.monotonic() - tick)))
                with self.lock:
                    self.state = "stopped" if self.stop_event.is_set() else "completed"
                    self.revision += 1
                save({"type": "summary", "samples": len(self.samples), "state": self.state, "error": None})
        except Exception as exc:
            with self.lock:
                self.state, self.error = "error", str(exc)
                self.revision += 1
            # Persist the failure even if it happened before the recording opened.
            try:
                with (directory / f"{self.session_id}-web.jsonl").open("a", encoding="utf-8") as stream:
                    stream.write(json.dumps({"type": "error", "message": str(exc)}, ensure_ascii=False) + "\n")
            except OSError:
                pass


def verified_replay():
    """Serve only the named real measurement after its recorded hash matches."""
    import hashlib
    summary_path = ROOT.parent / "notes/live-wifi-test-20260913.json"
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    path = ROOT / "recordings/20260913-185349-971973.jsonl"
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != summary["raw_sha256"]:
        raise RuntimeError("历史实测记录校验失败，无法回放。")
    rows = [json.loads(line) for line in raw.decode("utf-8").splitlines()]
    return {
        "source": "real-windows-netsh-rssi", "mode": "replay", "state": "completed", "error": None,
        "session_id": "20260913-185349", "started_at": rows[1]["timestamp"],
        "duration_seconds": 180, "interface": rows[0]["interface"],
        "upstream_commit": rows[0]["upstream_commit"],
        "ground_truth": "用户未配合受控动作；没有动作真值。",
        "window_seconds": 15, "presence_variance_threshold": .3, "motion_energy_threshold": .05,
        "samples": [r for r in rows if r["type"] == "sample"],
        "reports": [r for r in rows if r["type"] == "classification"],
    }
