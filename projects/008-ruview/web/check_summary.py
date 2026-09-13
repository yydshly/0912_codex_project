"""Check publish boundaries, static links and summary access from local pages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist"


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])


def main():
    expected = {"index.html", "summary.css", "summary.js", "favicon.svg"}
    actual = {p.relative_to(OUT).as_posix() for p in OUT.rglob("*") if p.is_file()}
    assert actual == expected, actual
    document = Document()
    document.feed((OUT / "index.html").read_text(encoding="utf-8"))
    assert len(document.ids) == len(set(document.ids))
    for target in document.links:
        url = urlparse(target)
        if url.scheme:
            assert url.scheme == "https" and url.hostname not in ("localhost", "127.0.0.1"), target
        else:
            assert not url.netloc and not url.path.startswith("/"), target
            if url.path:
                assert (OUT / unquote(url.path)).is_file(), target
            if url.fragment:
                assert unquote(url.fragment) in document.ids, target
    for name in ("index.html", "live.html", "scene.html"):
        page = Document()
        page.feed((ROOT / "public" / name).read_text(encoding="utf-8"))
        assert "summary.html" in page.links, name
    print("PASS: public-only file allowlist, portable links, section anchors, and all 3 local summary entrances.")


if __name__ == "__main__":
    main()
