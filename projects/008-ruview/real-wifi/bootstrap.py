"""Fetch the pinned upstream modules without modifying their implementation."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent


def prepare():
    lock = json.loads((ROOT / "upstream-lock.json").read_text(encoding="utf-8"))
    for item in lock["files"]:
        target = ROOT / ".upstream" / item["path"]
        if not target.exists():
            url = f"https://raw.githubusercontent.com/ruvnet/RuView/{lock['commit']}/{item['path']}"
            with urlopen(url, timeout=30) as response:
                data = response.read()
            if hashlib.sha256(data).hexdigest() != item["sha256"]:
                raise RuntimeError(f"Upstream hash mismatch: {item['path']}")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        if hashlib.sha256(target.read_bytes()).hexdigest() != item["sha256"]:
            raise RuntimeError(f"Cached source changed: {item['path']}")
    return lock


if __name__ == "__main__":
    prepare()
    print("Pinned upstream sources verified.")
