# AGENTS.md — lbenitez.dev

Zola static site; custom templates/styles layered over the Terminus theme (git submodule).

## Toolchain constraint (read first)

- This site builds with **Zola 0.21.x only**. Zola ≥0.22 cannot build it as-is: Tera 2 removed the macro syntax the Terminus templates use (`post_macros::header(...)` fails to parse), and `[markdown]` config keys changed (`highlight_code`/`highlight_theme` → `[markdown.highlighting]`, Syntect → Giallo).
- Homebrew's `zola` is 0.23.x — do not use it. A 0.21.0 binary lives at `~/.local/bin/zola`; make sure it resolves before brew's in PATH. (Fresh machines: grab the 0.21.0 release from getzola/zola GitHub releases.)
- The deploy workflow builds with Zola 0.21.0 (`shalzz/zola-deploy-action@v0.21.0` — the action's version tags track Zola versions). Local and CI versions must match or deploys break.
- Upgrading to 0.23 means a real migration (templates → Tera 2 components, highlighting config, action bump) — not a version bump.

## Commands

```bash
zola serve                      # dev server
zola check                      # validate content, templates, links
zola build                      # build into public/ (gitignored)
python3 tests/site_smoke.py      # full verification: check + build, then asserts routes, key text, section feeds
```

Run `tests/site_smoke.py` after any config, template, or content-structure change. It shells out to `zola` from PATH, so the 0.21 binary must resolve first.

## Architecture

- Site templates in `templates/` override same-named Terminus templates; partials resolve site-first. Never edit anything inside `themes/terminus` (submodule, pinned commit).
- Listing behavior branches on `section.extra.stream_type` (`notes` / `links`) in `templates/section.html`; individual-page behavior branches on `page.extra.content_type` (`link`) in `templates/page.html`.
- Feeds are per-section: `generate_feeds = true` in a section's `_index.md` produces `<section>/atom.xml`. There is no site-wide feed.
- Sass load order in `sass/css/style.scss`: theme first, then local partials (fonts → overrides → header → syntax → streams). New listing styles go in `sass/css/_streams.scss`.
- Dark/light palettes are Sass maps in `sass/css/_variables.scss`, applied via the `theme-color()` helper in `_overrides.scss`. Change colors in the maps, not ad-hoc hex values. `static/js/theme-toggle.js` has a `COLORS` map that must match the palette backgrounds.
- Content model (front matter per section type) is documented in `README.md`. Note: a Link page without `extra.target_url` fails the build (template reads it directly).

## Deployment

- Push to `main` → `.github/workflows/deploy.yml` rebuilds from source **in CI** with Zola 0.21.0 (submodules checked out) and pushes to `gh-pages`. GitHub Pages serves the `gh-pages` branch.
- `public/` is gitignored: local build output never reaches Pages. Building locally is for preview only.

## Tera/Zola gotchas (0.21)

- Accessing a missing `extra` key in a template errors at build time. Use `| default(value="")` for optional keys, e.g. `page.extra.content_type | default(value="")`.
- Internal Markdown links use `@/` paths: `[Posts](@/posts/_index.md)`.
- Zola escapes `/` in rendered attributes as `&#x2F;` — plain-text greps for URLs in built HTML will miss.
- Listing order is made explicit in templates with `| sort(attribute="date") | reverse` (newest first); don't rely on Zola's default page order.

## Local environment quirks

- The checkout directory name ends with a space (`Writtings `). Construct paths from the session's working directory, not from memory.

## Reference

- `docs/superpowers/specs/2026-09-25-personal-blog-design.md` — approved design spec (IA, visual direction, constraints); `docs/superpowers/plans/…-personal-blog-redesign.md` — the implementation plan that produced the current site.
