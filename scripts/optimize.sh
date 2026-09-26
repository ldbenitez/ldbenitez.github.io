#!/usr/bin/env bash
#
# Post-build asset optimization. Run after `zola build`.
#
#   scripts/optimize.sh [public_dir]
#
# 1. Prunes theme assets the site never references (KaTeX, Fira Code, unused
#    social icons) from the built output.
# 2. Minifies the remaining JavaScript in place with the installed esbuild.
#    Zola already minifies the compiled CSS, so only JS is touched.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
public_dir="${1:-$root/public}"

python3 "$root/scripts/optimize_public.py" "$public_dir"

shopt -s nullglob
scripts=("$public_dir"/js/*.js)
if [ "${#scripts[@]}" -eq 0 ]; then
  exit 0
fi

esbuild="$root/node_modules/.bin/esbuild"
if [ ! -x "$esbuild" ]; then
  echo "optimize: esbuild is missing; run npm ci before optimizing" >&2
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

"$esbuild" "${scripts[@]}" --minify --outdir="$tmp" --log-level=warning
cp "$tmp"/*.js "$public_dir"/js/
echo "optimize: minified ${#scripts[@]} script(s)"
