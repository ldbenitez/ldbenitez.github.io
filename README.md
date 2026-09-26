# lbenitez.dev

Personal website built with [Zola](https://www.getzola.org/), with custom templates
and styles on top of the [Terminus](https://github.com/ejmg/terminus) theme.

## Development

```bash
zola serve
```

## Verify and build

```bash
zola check             # validate content, templates, and links
zola build             # generate the static site into public/
python3 tests/site_smoke.py   # check routes, key content, and section feeds
```

> Use Zola 0.21.x to match the version used by the GitHub Pages deploy action.

## Content

| Section | Path | Front matter |
| --- | --- | --- |
| Posts | `content/posts/` | `title` (required), `date` (required), `description`, `taxonomies.tags` (optional) |
| Notes | `content/notes/` | `date` (required), `title` (optional), `extra.content_type = "note"` |
| Links | `content/links/` | `title`, `date`, `extra.target_url` (required), `extra.commentary`, `taxonomies.tags` (optional), `extra.content_type = "link"` |
| About | `content/about.md` | `title` |

Notes are short thoughts; a title is not needed. Links are authored locally as
Markdown — no plugin or external bookmarking service is required. Each note and
link gets a stable URL of its own.

Posts, Notes, and Links each generate an Atom feed (for example `/posts/atom.xml`)
and are listed newest first. The site ships coordinated dark and light themes; the
toggle follows your system preference until you pick one explicitly.

## Orbital notebook

Type `cosmos` anywhere outside an editable field, or open the footer's `>_`
command prompt and enter the same phrase. The orbital notebook loads on demand.

- **Solar System** opens an illustrative model of all eight planets, Saturn's
  rings, Earth's Moon, and the asteroid belt. Tap a planet or use **Explore**
  for a short fact. Sizes, distances, and orbital speeds are compressed.
- **Milky Way** shows a stylized rotating spiral galaxy. Tap **You are here**
  or **Visit the Solar System** to return home. The galaxy is an artistic model,
  not a measured star map or a simulation of individual stellar dynamics.
- **Black Hole**, inspired by Interstellar, shows a dark shadow, photon ring,
  and flowing accretion disk bent into luminous arcs. It is a cinematic
  illustration of gravitational lensing, not a relativistic simulation.
- Atlas views offer a **Speed** selector. **Playground** retains the
  original interactive gravity simulation described below.
- Comets that touch a planet or the Sun dissolve into a brief shockwave and
  sparks. Solar impacts also brighten the halo. These are decorative effects;
  planets retain their orbits. Pause freezes the effects; reduced motion hides them.

- Drag from an empty spot and release to launch toward the arrow. Longer drags
  launch faster; a click without dragging drops a planet toward the star.
- **Launch planet** starts keyboard aiming: arrows choose a position, Enter
  switches to velocity, then arrows adjust it and Enter launches. Shift makes
  larger adjustments; `0` clears velocity for a drop.
- Escape cancels an aim first, then closes. **Pause**, **Resume**, and **Reset**
  are available; reset preserves the pause state.
- Reduced motion opens the scene paused. Hidden tabs suspend the simulation;
  closing disposes it and restores focus and the reading position.

`cosmos-trigger.js` owns activation and dialogs, `cosmos-physics.js` owns the
gravity simulation, `cosmos-scenes.js` renders the atlas, `cosmos-art.js` provides
shared visual effects, and `cosmos.js` owns the animation loop and input. Colors come from the Sass
theme maps. The fixed star attracts every planet; planets pass through each
other. At 24 planets, a new launch replaces the oldest visitor-created planet.

Verification uses Node's built-in runner (Node 22.7+ with ES-module detection)
and the existing Zola 0.21.x site check:

```bash
node --test tests/cosmos-*.test.mjs
env PATH="$HOME/.local/bin:$PATH" python3 tests/site_smoke.py
```

## Deployment

Pushing to `main` builds and publishes the site to GitHub Pages via the existing
workflow in `.github/workflows/deploy.yml`.
