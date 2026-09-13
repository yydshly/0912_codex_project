"""Build only the public RuView research summary; no sensors or upstream needed."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"
FILES = {"summary.html": "index.html", "summary.css": "summary.css", "summary.js": "summary.js", "favicon.svg": "favicon.svg"}


def main():
    # Rebuild only this subproject's exact output directory; reject redirection.
    if OUT.is_symlink() or OUT.resolve() != ROOT / "dist":
        raise ValueError("Unexpected summary output directory")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for source, destination in FILES.items():
        shutil.copy2(ROOT / "public" / source, OUT / destination)
    print("Built RuView public summary: 4 static files; no local sensor data or runtime.")


if __name__ == "__main__":
    main()
