#!/usr/bin/env bash
#
# Post-build asset optimization. Run after `zola build`.
#
#   scripts/optimize.sh [public_dir]
#
# 1. Prunes theme assets the site never references (KaTeX, Fira Code, unused
#    social icons) from the built output.
# 2. Minifies the remaining custom JavaScript in place, when esbuild is
#    reachable. Zola already minifies the compiled CSS, so only JS is touched.
#
# JS minification is best-effort: a missing Node/esbuild/network only prints a
# warning and leaves the unminified files in place.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
public_dir="${1:-$root/public}"

python3 "$root/scripts/optimize_public.py" "$public_dir"

if ! command -v npx >/dev/null 2>&1; then
  echo "optimize: npx not found, skipping JS minification"
  exit 0
fi

shopt -s nullglob
scripts=("$public_dir"/js/*.js)
if [ "${#scripts[@]}" -eq 0 ]; then
  exit 0
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if npx --yes esbuild "${scripts[@]}" --minify --outdir="$tmp" --log-level=warning; then
  cp "$tmp"/*.js "$public_dir"/js/
  echo "optimize: minified ${#scripts[@]} script(s)"
else
  echo "optimize: esbuild unavailable, leaving JS unminified" >&2
fi
