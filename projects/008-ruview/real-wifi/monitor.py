"""Real Windows RSSI -> unmodified RuView v1 feature extractor/classifier.

The local adapter rejects missing/disconnected readings. It does not use the
upstream collector's default RSSI, assumed noise floor, or synthetic byte counts.
"""
import argparse
from collections import deque
from datetime import datetime, timezone
import importlib.util
import json
import locale
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import types

from bootstrap import ROOT, prepare


def load_upstream():
    lock = prepare()
    # Upstream archive files still import v1.src.sensing. Load only the required
    # modules under that namespace; avoid the obsolete package initializer.
    for name in ("v1", "v1.src", "v1.src.sensing"):
        package = types.ModuleType(name)
        package.__path__ = []
        sys.modules[name] = package
    modules = {}
    for stem in ("rssi_collector", "feature_extractor", "classifier"):
        name = f"v1.src.sensing.{stem}"
        path = ROOT / ".upstream/archive/v1/src/sensing" / f"{stem}.py"
        spec = importlib.util.spec_from_file_location(name, path)
        module = importlib.util.module_from_spec(spec)
        sys.modules[name] = module
        spec.loader.exec_module(module)
        modules[stem] = module
    return lock, modules


def parse_reading(output, interface):
    blocks = re.split(r"(?m)^\s*(?:Name|名称)\s*:\s*", output)[1:]
    selected = None
    for block in blocks:
        lines = block.splitlines()
        if lines and lines[0].strip().casefold() == interface.casefold():
            selected = block
            break
    if selected is None:
        raise RuntimeError(f"找不到无线接口 {interface}；请确认网卡名称。")
    state = re.search(r"(?im)^\s*(?:State|状态)\s*:\s*(.+)$", selected)
    if not state or state[1].strip().casefold() not in ("connected", "已连接"):
        raise RuntimeError("WiFi 未连接，或系统输出无法识别；停止采集。")
    match = re.search(r"(?im)^\s*Rssi\s*:\s*(-?\d+(?:\.\d+)?)\s*$", selected)
    if not match:
        raise RuntimeError("系统没有提供原始 RSSI；停止采集，不用信号百分比或默认值代替。")
    rssi = float(match[1])
    if not math.isfinite(rssi) or not -120 <= rssi <= 0:
        raise RuntimeError("RSSI 数值超出合理范围；停止采集。")
    return rssi


def collect(interface):
    result = subprocess.run(
        ["netsh", "wlan", "show", "interfaces"], capture_output=True,
        timeout=5,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if result.returncode:
        raise RuntimeError("系统 WiFi 查询失败；请确认 WiFi 连接及系统权限。")
    # Hidden netsh on this Windows emits Chinese UTF-8, while an inherited
    # console may use the system code page. Decode bytes before field matching.
    try:
        output = result.stdout.decode("utf-8-sig")
    except UnicodeDecodeError:
        output = result.stdout.decode(locale.getpreferredencoding(False))
    return time.time(), parse_reading(output, interface)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seconds", type=int, default=180)
    parser.add_argument("--interface", default="WLAN")
    parser.add_argument("--label", default="unlabelled")
    args = parser.parse_args()
    if not 15 <= args.seconds <= 3600:
        parser.error("seconds must be between 15 and 3600")
    if os.name != "nt":
        parser.error("This entry point requires native Windows.")
    lock, modules = load_upstream()
    Sample = modules["rssi_collector"].WifiSample
    extractor = modules["feature_extractor"].RssiFeatureExtractor(window_seconds=15)
    classifier = modules["classifier"].PresenceClassifier(
        presence_variance_threshold=0.3, motion_energy_threshold=0.05,
    )
    # Validate hardware before creating a recording.
    first = collect(args.interface)
    output_dir = ROOT / "recordings"
    output_dir.mkdir(exist_ok=True)
    path = output_dir / f"{datetime.now():%Y%m%d-%H%M%S-%f}.jsonl"
    samples = deque(maxlen=60)
    count, min_rssi, max_rssi = 0, math.inf, -math.inf
    start, last_report = time.monotonic(), 0.0
    names = {"absent": "未检出变化", "present_still": "低频变化", "active": "活动候选"}
    print("真实 WiFi 实测：AX/普通网卡 RSSI → RuView 原版特征与分类。", flush=True)
    print("前 15 秒为窗口预热；每 3 秒输出一次。Ctrl+C 停止并保留记录。", flush=True)
    print("建议每 30 秒交替：静止 → 穿过路由器与电脑之间走动 → 静止。", flush=True)
    print("判定仅是信号阈值结果；absent 不证明房间无人，分数不是准确率。", flush=True)
    print(f"记录：{path}", flush=True)
    metadata = {
        "type": "metadata", "source": "real-windows-netsh-rssi",
        "upstream_commit": lock["commit"], "label": args.label,
        "ground_truth": "unverified-user-label", "interface": args.interface,
        "window_seconds": 15, "target_sample_rate_hz": 2,
        "presence_variance_threshold": 0.3, "motion_energy_threshold": 0.05,
        "limitations": "RSSI classification only; no CSI, pose, people count or vital signs",
    }
    error = None
    with path.open("x", encoding="utf-8") as stream:
        def save(item):
            stream.write(json.dumps(item, ensure_ascii=False, allow_nan=False) + "\n")
            stream.flush()
        save(metadata)
        try:
            while time.monotonic() - start < args.seconds:
                tick = time.monotonic()
                stamp, rssi = first if count == 0 else collect(args.interface)
                elapsed = time.monotonic() - start
                count += 1
                min_rssi, max_rssi = min(min_rssi, rssi), max(max_rssi, rssi)
                # Auxiliary fields are unavailable and never displayed or saved.
                # Upstream RSSI extractor consumes only timestamps and RSSI.
                samples.append(Sample(stamp, rssi, None, None, None, None, None, args.interface))
                save({"type": "sample", "timestamp": stamp, "elapsed_seconds": round(elapsed, 3), "rssi_dbm": rssi})
                if elapsed >= 15 and elapsed - last_report >= 3:
                    features = extractor.extract(list(samples))
                    result = classifier.classify(features)
                    level = result.motion_level.value
                    report = {
                        "type": "classification", "timestamp": stamp,
                        "elapsed_seconds": round(elapsed, 3), "window_samples": features.n_samples,
                        "sample_rate_hz": features.sample_rate_hz,
                        "mean_dbm": features.mean, "variance": features.variance,
                        "motion_energy": features.motion_band_power,
                        "upstream_label": level, "upstream_score": result.confidence,
                    }
                    save(report)
                    print(f"{elapsed:5.0f}s | RSSI {rssi:5.0f} dBm | 波动 {features.variance:6.3f} | {names[level]} ({level})", flush=True)
                    last_report = elapsed
                time.sleep(max(0, 0.5 - (time.monotonic() - tick)))
        except KeyboardInterrupt:
            print("已手动停止。")
        except Exception as exc:
            error = str(exc)
            save({"type": "error", "message": error})
        save({"type": "summary", "samples": count, "min_rssi_dbm": min_rssi if count else None,
              "max_rssi_dbm": max_rssi if count else None, "error": error})
    print(f"共 {count} 个实测样本；RSSI 范围 {min_rssi:g} 到 {max_rssi:g} dBm。")
    if error:
        raise RuntimeError(error)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"实测停止：{exc}", file=sys.stderr)
        sys.exit(1)
