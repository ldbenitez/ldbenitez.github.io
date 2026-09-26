# lbenitez.dev

Personal website built with [Zola](https://www.getzola.org/), with custom templates
and styles on top of the [Terminus](https://github.com/ejmg/terminus) theme.

## Development

```bash
zola serve
```

Use Zola 0.22.1, the version pinned in the deploy workflow.

## Verify and build

```bash
zola check
zola build
python3 tests/site_smoke.py
node --test tests/cosmos-*.test.mjs
bash scripts/optimize.sh
```

The optimizer runs after the build. It removes unused theme assets and minifies
custom JavaScript when esbuild is available. CI runs it before publishing.

## Content

| Section | Path | Front matter |
| --- | --- | --- |
| Posts | `content/posts/` | `title` (required), `date` (required), `description`, `taxonomies.tags` (optional) |
| Notes | `content/notes/` | `date` (required), `title` (optional), `extra.content_type = "note"` |
| Links | `content/links/` | `title`, `date`, `extra.target_url` (required), `extra.commentary`, `taxonomies.tags` (optional), `extra.content_type = "link"` |
| About | `content/about.md` | `title` |

Notes can be untitled. Links are authored as Markdown. Each entry has a stable URL.

Posts, Notes, and Links each generate an Atom feed (for example `/posts/atom.xml`)
and are listed newest first. The site ships coordinated dark and light themes; the
toggle follows your system preference until you pick one explicitly.

## Orbital notebook

Type `cosmos` outside an editable field, or enter it in the footer command prompt.
The notebook loads on demand and offers Solar System, Milky Way, Black Hole, and
interactive gravity Playground views. The atlas scenes are illustrations, not
scientific simulations. See the on-screen controls for navigation and input.

## Deployment

Pushing to `main` builds and publishes the site to GitHub Pages via the existing
workflow in `.github/workflows/deploy.yml`.
