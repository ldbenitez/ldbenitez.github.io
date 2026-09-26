from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import subprocess
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ROUTES = (
    "index.html",
    "posts/index.html",
    "notes/index.html",
    "links/index.html",
    "about/index.html",
)
FEEDS = (
    "posts/atom.xml",
    "notes/atom.xml",
    "links/atom.xml",
)


class CosmosMarkup(HTMLParser):
    def __init__(self):
        super().__init__()
        self.launchers = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "button" and "data-cosmos-launcher" in attrs:
            self.launchers.append(attrs)
        if tag == "script" and urlparse(attrs.get("src", "")).path.endswith("/js/cosmos-trigger.js"):
            self.scripts.append(attrs)


def check_cosmos(html, route):
    markup = CosmosMarkup()
    markup.feed(html)
    if len(markup.launchers) != 1 or len(markup.scripts) != 1:
        raise SystemExit(f"{route}: expected one cosmos launcher and activation script")
    launcher = markup.launchers[0]
    if "hidden" not in launcher or launcher.get("aria-label") != "Open command prompt":
        raise SystemExit(f"{route}: launcher must start hidden and have an accessible label")
    if "defer" not in markup.scripts[0]:
        raise SystemExit(f"{route}: activation script must be deferred")
    module_url = urlparse(launcher.get("data-cosmos-module", ""))
    trigger_url = urlparse(markup.scripts[0]["src"])
    if not module_url.path.endswith("/js/cosmos.js") or module_url.netloc != trigger_url.netloc:
        raise SystemExit(f"{route}: missing or inconsistent local playground URL")


def main() -> None:
    subprocess.run(["zola", "check"], cwd=ROOT, check=True)
    subprocess.run(["zola", "build"], cwd=ROOT, check=True)

    missing = [path for path in ROUTES + FEEDS if not (PUBLIC / path).is_file()]
    if missing:
        raise SystemExit("Missing generated files: " + ", ".join(missing))

    expected_text = {
        "index.html": ("~/writing", "Recent posts", "Posts", "Notes", "Links", "About"),
        "posts/index.html": ("~/posts", "Posts", "Atom feed"),
        "notes/index.html": ("~/notes", "Notes", "Atom feed"),
        "links/index.html": ("~/links", "Links", "Atom feed"),
        "about/index.html": ("~/about", "About", "Leonardo Benítez"),
    }
    for relative_path, labels in expected_text.items():
        html = (PUBLIC / relative_path).read_text(encoding="utf-8")
        for label in labels:
            if label not in html:
                raise SystemExit(f"{relative_path} is missing expected text: {label}")
        check_cosmos(html, relative_path)

    if "<h1>Leonardo Benítez</h1>" in (PUBLIC / "index.html").read_text(encoding="utf-8"):
        raise SystemExit("index.html repeats the site owner's name in the page heading")
    if 'class="post content intro-page"' not in (PUBLIC / "about/index.html").read_text(encoding="utf-8"):
        raise SystemExit("about/index.html is missing the shared intro spacing")

    check_cosmos((PUBLIC / "archive/index.html").read_text(encoding="utf-8"), "archive/index.html")
    for name in ("cosmos-trigger.js", "cosmos.js", "cosmos-physics.js", "cosmos-art.js", "cosmos-scenes.js", "cosmos-facts.js", "cosmos-black-hole.js", "cosmos-audio.js"):
        if not (PUBLIC / "js" / name).is_file():
            raise SystemExit(f"Missing playground asset: {name}")

    for relative_path in FEEDS:
        root = ET.parse(PUBLIC / relative_path).getroot()
        if root.tag.rsplit("}", 1)[-1] != "feed":
            raise SystemExit(f"Not an Atom feed: {relative_path}")

    print("Site smoke checks passed: 5 routes, 3 section feeds, and cosmos wiring on 6 pages")


if __name__ == "__main__":
    main()
