#!/usr/bin/env python3
"""Prune static assets that Zola copied but no built page references.

Zola copies the entire theme `static/` directory into `public/`, so optional
theme features (KaTeX, Fira Code, every social icon) are deployed even when the
site never uses them. This walks the built site, collects every asset path the
HTML and CSS actually reference, and deletes the rest.

Only fonts and images are pruned wholesale; JS is never pruned generically
because the Cosmos modules are loaded dynamically via import() and would not
appear in the HTML. A short allowlist covers the two unused theme scripts and
the KaTeX stylesheet.

Usage:
    python3 scripts/optimize_public.py [public_dir]
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

PRUNE_DIRS = {"fonts", "images"}
PRUNE_SUFFIXES = {".woff", ".woff2", ".ttf", ".eot", ".otf", ".svg", ".png",
                  ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico"}
# Optional theme assets that ship by default but are only needed when the
# matching feature is enabled in config.toml.
OPTIONAL_THEME_FILES = {"css/katex.min.css", "js/katex.min.js", "js/theme-switcher.js"}

ATTR_RE = re.compile(r"""(?:href|src|poster)\s*=\s*["']([^"']+)["']""", re.I)
CSS_URL_RE = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", re.I)
SCAN_SUFFIXES = {".html", ".css", ".js", ".xml", ".txt"}


def _normalize(raw: str) -> str:
    raw = raw.strip().split("#", 1)[0].split("?", 1)[0]
    if "://" in raw:
        raw = urlparse(raw).path
    return unquote(raw).lstrip("/")


def referenced_paths(public: Path) -> set[str]:
    refs: set[str] = set()
    for path in public.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in SCAN_SUFFIXES:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        text = html.unescape(text)
        for raw in ATTR_RE.findall(text) + CSS_URL_RE.findall(text):
            refs.add(_normalize(raw))
    return refs


def main() -> int:
    public = Path(sys.argv[1] if len(sys.argv) > 1 else "public").resolve()
    if not public.is_dir():
        print(f"optimize_public: {public} does not exist, skipping")
        return 0

    refs = referenced_paths(public)
    removed: list[Path] = []
    saved = 0

    for path in sorted(public.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(public)
        rel_str = rel.as_posix()
        prunable = (
            (rel.parts[0] in PRUNE_DIRS and path.suffix.lower() in PRUNE_SUFFIXES)
            or rel_str in OPTIONAL_THEME_FILES
        )
        if not prunable or rel_str in refs:
            continue
        saved += path.stat().st_size
        removed.append(rel)

    for rel in removed:
        (public / rel).unlink()

    for directory in sorted(public.rglob("*"), reverse=True):
        if directory.is_dir() and not any(directory.iterdir()):
            directory.rmdir()

    print(f"optimize_public: pruned {len(removed)} unreferenced asset(s), "
          f"{saved / 1024:.0f} KiB freed")
    for rel in removed:
        print(f"  - {rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
