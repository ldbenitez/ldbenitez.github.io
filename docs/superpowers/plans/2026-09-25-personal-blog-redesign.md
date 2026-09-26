# Personal Blog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a writing-first Zola site with distinct Posts, Notes, and Links streams, a concise About page, and a personal design with coordinated dark and light themes.

**Architecture:** Keep Markdown as the source of truth and use Zola sections for chronological content, stable page URLs, and section feeds. Add first-party Tera templates and Sass in this repository, reusing the useful Terminus base and existing theme-toggle behavior. Keep GitHub Pages deployment unchanged.

**Tech Stack:** Zola CLI, Tera templates, TOML front matter/config, Sass, existing GitHub Pages workflow, Python 3 standard library for generated-site smoke checks.

## Global Constraints

- Keep Zola, Markdown authoring, and the existing GitHub Pages deployment.
- The root URL is the writing homepage; it no longer redirects to `/posts/`.
- Navigation is **Posts · Notes · Links · About**.
- Posts, Notes, and Links have distinct chronological listings and stable entry URLs.
- Notes are brief, may omit a title, and do not require tags.
- Links have a title and destination URL; commentary and topic tags are optional.
- Generate static HTML and separate RSS feeds for Posts, Notes, and Links. A combined feed is not required.
- Do not add a backend, database, account system, third-party bookmark-saving service, or Links plugin.
- Keep dark and light themes visually coordinated and preserve system preference plus saved user choice.
- Keep the site usable on mobile, keyboard operable, semantically structured, and readable in both themes.
- Keep the current GitHub Pages action as the publishing path.

---

## File map

| File | Responsibility |
| --- | --- |
| `config.toml` | Site metadata, theme setup, menu, and tag taxonomy. |
| `content/_index.md` | Root page metadata; remove the current redirect. |
| `content/posts/_index.md` | Posts section title, chronology, pagination, and section feed. |
| `content/notes/_index.md` | Notes section title, chronology, stream kind, and section feed. |
| `content/links/_index.md` | Links section title, chronology, stream kind, and section feed. |
| `content/about.md` | Concise author profile. |
| `content/archive/_index.md` | Existing Posts archive route. |
| `templates/index.html` | Writing-first homepage. |
| `templates/section.html` | Section listing shell for Posts, Notes, and Links. |
| `templates/page.html` | Shared individual-page shell, branching for Posts, Notes, and Links. |
| `templates/archive.html` | Chronological Posts archive. |
| `templates/partials/` | Small shared listing/presentation fragments for Notes and Links. |
| `sass/css/_variables.scss` | Dark/light palettes, typography, spacing, and breakpoints. |
| `sass/css/_overrides.scss` | Theme tokens, focus states, and shared controls. |
| `sass/css/_header.scss` | Logo, navigation, theme toggle, and responsive header. |
| `sass/css/_streams.scss` | Posts, Notes, Links, archive, and empty-state listings. |
| `sass/css/style.scss` | Sass entry point and load order. |
| `tests/site_smoke.py` | Standard-library smoke checks for built routes and Atom feeds. |
| `README.md` | Local development/build commands and how to author each content type. |
| `.gitignore` | Ignore `.superpowers/` visual-companion artifacts. |

Do not modify files inside `themes/terminus`; keep custom templates and styles in the site repository.

## Prerequisite

The current workspace does not have Zola installed. Before implementation, run `zola --version`. If the command is unavailable on this macOS environment, install it with `brew install zola`, then confirm `zola --version` succeeds. Run a baseline `zola check` and `zola build` before changing templates.

## Task 1: Add generated-site smoke checks

**Files:**
- Create: `tests/site_smoke.py`

- [ ] **Step 1: Add the smoke check before building the new routes**

Create `tests/site_smoke.py` with this standard-library-only check:

```python
from pathlib import Path
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


def main() -> None:
    subprocess.run(["zola", "check"], cwd=ROOT, check=True)
    subprocess.run(["zola", "build"], cwd=ROOT, check=True)

    missing = [path for path in ROUTES + FEEDS if not (PUBLIC / path).is_file()]
    if missing:
        raise SystemExit("Missing generated files: " + ", ".join(missing))

    expected_text = {
        "index.html": ("Leonardo Benítez", "Recent posts", "Posts", "Notes", "Links", "About"),
        "posts/index.html": ("Posts", "Atom feed"),
        "notes/index.html": ("Notes", "Atom feed"),
        "links/index.html": ("Links", "Atom feed"),
        "about/index.html": ("About", "Leonardo Benítez"),
    }
    for relative_path, labels in expected_text.items():
        html = (PUBLIC / relative_path).read_text(encoding="utf-8")
        for label in labels:
            if label not in html:
                raise SystemExit(f"{relative_path} is missing expected text: {label}")

    for relative_path in FEEDS:
        root = ET.parse(PUBLIC / relative_path).getroot()
        if root.tag.rsplit("}", 1)[-1] != "feed":
            raise SystemExit(f"Not an Atom feed: {relative_path}")

    print("Site smoke checks passed: 5 routes and 3 section feeds")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the check and confirm the missing-route failure**

Run: `python3 tests/site_smoke.py`  
Expected: Zola's baseline check/build succeeds, then the script reports that the Notes, Links, About, and section-feed outputs are missing. Do not weaken the assertions; later tasks create those outputs.

## Task 2: Establish content sections, routes, and feeds

**Files:**
- Modify: `config.toml`
- Modify: `content/_index.md`
- Modify: `content/posts/_index.md`
- Create: `content/notes/_index.md`
- Create: `content/links/_index.md`
- Create: `content/about.md`

- [ ] **Step 1: Define the four-item navigation and concise site description**

In `config.toml`, replace `main_menu` with Posts, Notes, Links, and About, each using its canonical trailing-slash URL. Keep the existing GitHub social link, author, base URL, and tag taxonomy. Add a short global description suitable for page metadata and feeds.

- [ ] **Step 2: Make the root section renderable as a page instead of a redirect**

In `content/_index.md`, remove `redirect_to = "posts"`; set the root section title to `Leonardo Benítez` and give it a short description. Do not create a large bio block here.

- [ ] **Step 3: Make Posts explicit and enable its section feed**

Set `content/posts/_index.md` title to `Posts`, retain date sorting, pagination, anchor links, and copy-button configuration, and set `generate_feeds = true`.

- [ ] **Step 4: Add Notes and Links section metadata**

Create `content/notes/_index.md`:

```toml
+++
title = "Notes"
sort_by = "date"
generate_feeds = true
[extra]
stream_type = "notes"
+++
```

Create `content/links/_index.md`:

```toml
+++
title = "Links"
sort_by = "date"
generate_feeds = true
[extra]
stream_type = "links"
+++
```

- [ ] **Step 5: Add the concise About route**

Create `content/about.md` with title `About`, a short first-person introduction that identifies Leonardo as the author of the site, and the existing GitHub profile link. Use Markdown and avoid inventing biography details.

- [ ] **Step 6: Check the TOML and section routes**

Run: `zola check`  
Expected: PASS; the new sections and About page parse without front-matter or URL errors.

Run: `python3 tests/site_smoke.py`  
Expected: FAIL only on outputs/templates not created by subsequent tasks.

## Task 3: Build the shared shell and Posts-first homepage

**Files:**
- Modify: `templates/base.html`
- Create: `templates/index.html`
- Modify: `sass/css/_variables.scss`
- Modify: `sass/css/_overrides.scss`
- Modify: `sass/css/_header.scss`
- Modify: `sass/css/style.scss`
- Create: `sass/css/_streams.scss`
- Verify without changing unless necessary: `static/js/theme-toggle.js`

- [ ] **Step 1: Define one coordinated dark/light token set**

In `sass/css/_variables.scss`, retain the selected charcoal/warm-text/amber direction for dark mode and define a warm-paper/dark-ink/muted-rust light palette. Use the existing Sass maps and `theme-color` helper so code syntax colors remain mode-aware. Keep the palettes limited to background, foreground, muted text, accent, rules, and code surfaces.

- [ ] **Step 2: Add the shared site listing styles**

Create `sass/css/_streams.scss` for the post rows, note entries, link entries, archive rows, and empty states. Use shared date/metadata rules and a single-column reading layout; do not style each content type as a separate card system.

- [ ] **Step 3: Load the new styles after the Terminus base**

In `sass/css/style.scss`, load `_streams.scss` after theme styles and existing local token/override styles so site-specific rules win without editing the submodule.

- [ ] **Step 4: Update the shared header and metadata**

In `templates/base.html` and `sass/css/_header.scss`, preserve canonical links, description tags, the skip-to-content link, responsive navigation behavior, and the theme control. Style the compact `leonardo.md` wordmark and Posts · Notes · Links · About menu consistently with the selected mockup. Verify the existing `static/js/theme-toggle.js` already persists manual selection, follows `prefers-color-scheme` when no selection is saved, and has an accessible action label; change it only if one of those behaviors fails.

- [ ] **Step 5: Create the root homepage template**

Create `templates/index.html` extending `base.html`. It must render the author name, a short site description, a `Recent posts` heading, and the first five items from `get_section(path="posts/_index.md").pages`, in date order. Each row has a date, title permalink, optional description, and optional tags. When there are no posts, render a short empty-state sentence and keep the Posts archive link visible.

- [ ] **Step 6: Run build and smoke checks**

Run: `zola check && zola build`  
Expected: PASS and `public/index.html` uses the new homepage template.

Run: `python3 tests/site_smoke.py`  
Expected: homepage assertions pass; Posts, Notes, and Links listing assertions remain outstanding until their tasks are complete.

## Task 4: Implement Posts listing and archive

**Files:**
- Create: `templates/section.html`
- Modify: `templates/archive.html`
- Modify: `content/archive/_index.md`
- Modify: `sass/css/_streams.scss`

- [ ] **Step 1: Add the shared section template for Posts**

Create `templates/section.html` extending `base.html`. Render the section title and description, then render Posts by date with the title, date, optional excerpt, and optional tags. Keep pagination working from `content/posts/_index.md`. For an empty Posts section, show a concise empty state rather than a blank page.

- [ ] **Step 2: Keep the archive as a compact chronological index**

Retain `/archive/` and its existing custom template, with the title/date list and post count. Make dates semantic `<time datetime>` elements and ensure the archive links use each page permalink. Add an explicit empty-state sentence when no posts exist.

- [ ] **Step 3: Add feed access to the Posts listing**

Render a visible, labeled Atom-feed link from the Posts listing. Do not expose a raw XML link without a readable label.

- [ ] **Step 4: Validate Posts and archive output**

Run: `zola check && zola build`  
Expected: PASS; `public/posts/index.html`, `public/archive/index.html`, and `public/posts/atom.xml` exist.

Run: `python3 tests/site_smoke.py`  
Expected: Posts listing assertions pass; Notes and Links listing assertions remain outstanding until their tasks are complete.

## Task 5: Implement Notes stream and stable note pages

**Files:**
- Modify: `templates/section.html`
- Modify: `templates/page.html`
- Create: `templates/partials/note-entry.html`
- Modify: `sass/css/_streams.scss`

- [ ] **Step 1: Render Notes as dated short entries**

In `templates/section.html`, branch on `section.extra.stream_type == "notes"` and include `partials/note-entry.html` for each note. The listing shows the date and body, not a required heading. Each entry links to its own stable permalink, with an accessible label such as `Permalink to note from YYYY-MM-DD`.

- [ ] **Step 2: Render an individual note without requiring a title**

In `templates/page.html`, branch on `page.extra.content_type == "note"`; render the date and Markdown body as an article. Render the title only if one is supplied. Retain semantic landmarks and the shared base layout.

- [ ] **Step 3: Handle an empty Notes stream and expose its feed**

Use a concise empty-state message when there are no notes. Add a visible `Notes Atom feed` link on the Notes section. The feed is the section feed at `/notes/atom.xml`.

- [ ] **Step 4: Test an untitled note with a temporary Markdown fixture**

Create `content/notes/smoke-note.md` temporarily with:

```toml
+++
date = 2026-09-25
slug = "smoke-note"
extra.content_type = "note"
+++
This is a short thought without a title.
```

Run: `zola check && zola build`  
Expected: PASS; `public/notes/smoke-note/index.html` exists, contains the thought and date, and does not show a blank or `None` title.

Remove the temporary Markdown fixture, rebuild, then run `python3 tests/site_smoke.py`.

## Task 6: Implement Links stream and stable recommendation pages

**Files:**
- Modify: `templates/section.html`
- Modify: `templates/page.html`
- Create: `templates/partials/link-entry.html`
- Modify: `sass/css/_streams.scss`

- [ ] **Step 1: Render chronological Links entries**

In `templates/section.html`, branch on `section.extra.stream_type == "links"` and include `partials/link-entry.html` for each entry. Show publication date, title linked to its destination URL, optional commentary, and optional topic tags. Also include a local permalink to the recommendation.

- [ ] **Step 2: Render an individual recommendation page**

In `templates/page.html`, branch on `page.extra.content_type == "link"`; show its date, title, destination, optional commentary, and optional topics. Escape normal template values; do not mark arbitrary content or URLs `safe`.

- [ ] **Step 3: Handle empty state and feed access**

Use a concise empty state when no links exist. Add a visible `Links Atom feed` link on the Links section. The feed is the section feed at `/links/atom.xml`.

- [ ] **Step 4: Test metadata and destination URL with a temporary Markdown fixture**

Create `content/links/smoke-link.md` temporarily with:

```toml
+++
title = "A useful sample resource"
date = 2026-09-25
slug = "smoke-link"
taxonomies.tags = ["web"]
[extra]
content_type = "link"
target_url = "https://example.com/resource"
commentary = "A concise reason I recommend this."
+++
```

Run: `zola check && zola build`  
Expected: PASS; the Links listing contains the title, date, destination, commentary, and topic; `public/links/smoke-link/index.html` contains a working external destination and local permalink; `public/links/atom.xml` is valid Atom.

Remove the temporary Markdown fixture, rebuild, and run `python3 tests/site_smoke.py`.

## Task 7: Finish About, document authoring, and verify the complete site

**Files:**
- Modify: `templates/page.html`
- Modify: `sass/css/_streams.scss`
- Modify: `README.md`
- Modify only if verification fails: `templates/base.html`, `sass/css/_header.scss`, `sass/css/_overrides.scss`, `static/js/theme-toggle.js`

- [ ] **Step 1: Style About as a concise supporting page**

Ensure `/about/` uses the shared page layout and comfortable reading width, with the short profile and GitHub link. Keep About out of the homepage hero and avoid adding unrequested profile widgets.

- [ ] **Step 2: Document the publishing formats**

Update `README.md` with commands `zola serve`, `zola check`, and `zola build`; describe the content locations and required/optional front matter for Posts, Notes, and Links. State that Links are authored locally in Markdown and do not require a plugin or external service.

- [ ] **Step 3: Run the full build and generated-site smoke check**

Run: `zola check && python3 tests/site_smoke.py`  
Expected: PASS; the smoke script prints `Site smoke checks passed: 5 routes and 3 section feeds`.

- [ ] **Step 4: Manually review responsive and theme behavior**

Run: `zola serve` and inspect `/`, `/posts/`, `/notes/`, `/links/`, `/about/`, and `/archive/` at desktop and narrow mobile widths. Toggle dark/light; verify the selected mode persists after navigation and reload, and a fresh browser follows system preference. Check keyboard-only navigation, visible focus, skip-to-content, external Links, date labels, and text contrast. Stop the local server after review.

- [ ] **Step 5: Inspect the final diff**

Run: `git status --short && git diff --check && git diff`  
Expected: no whitespace errors; only planned site content, templates, styles, smoke checks, README, and the `.superpowers/` ignore rule are included. Keep the ignored `.superpowers/` visual-companion files out of version control.

## Plan self-review

- **Spec coverage:** homepage and navigation (Tasks 2–3); Posts/archive (Task 4); Notes (Task 5); Links (Task 6); About, RSS, accessibility, responsive behavior, and documentation (Tasks 1–7); Zola/GitHub Pages constraints (all tasks).
- **Placeholder scan:** each task names its files, actions, commands, and expected outcome; fixture Markdown is explicitly temporary and includes exact content.
- **Type consistency:** section selection uses `section.extra.stream_type` values `notes` and `links`; individual-page selection uses `page.extra.content_type` values `note` and `link`; feed locations consistently use each section's `atom.xml`.
