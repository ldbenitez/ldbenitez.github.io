# AGENTS.md — lbenitez.dev

Zola site with local templates and Sass layered over the Terminus git submodule.
Use Zola 0.22.1, matching `.github/workflows/deploy.yml`. The current theme
templates use macro syntax that Zola 0.23 cannot parse.

## Verify

```bash
zola check
python3 tests/site_smoke.py
node --test tests/cosmos-*.test.mjs
bash scripts/optimize.sh
```

`site_smoke.py` runs a fresh build and checks routes, content, feeds, and Cosmos
wiring. Run it after config, template, or content-structure changes. The optimizer
modifies the generated `public/` directory; run it after a build to verify the
deployed asset set.

## Architecture

- `templates/` overrides matching theme templates. Keep site changes outside
  `themes/terminus/`, which is a pinned submodule.
- `section.extra.stream_type` selects Notes or Links listings in
  `templates/section.html`; `page.extra.content_type` selects Link pages in
  `templates/page.html`. Content front matter is described in `README.md`.
- Each content section generates its own Atom feed. There is no site-wide feed.
- `sass/css/style.scss` loads the theme first, then local partials. Theme palettes
  live in `_variables.scss`; `static/js/theme-toggle.js` keeps matching background
  colors for the browser UI.
- `scripts/optimize_public.py` removes unreferenced theme assets from `public/`.
  If an asset is referenced only at runtime, add a retention rule there.
- `public/` is generated and gitignored. CI builds, optimizes, and publishes it
  to `gh-pages` on pushes to `main`.

## Template notes

- Missing `extra` keys cause build errors; use `| default(value="")` for
  optional keys.
- Internal Markdown links use `@/` paths.
- Templates explicitly sort dated entries newest first.
