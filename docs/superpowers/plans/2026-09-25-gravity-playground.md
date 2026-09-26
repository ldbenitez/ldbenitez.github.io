# Gravity Playground Implementation Plan

**Date:** 2026-09-25

**Source:** [Approved design specification](../specs/2026-09-25-gravity-playground-design.md)

**Status:** Implemented. Automated tests and site checks pass; remaining manual browser checks are recorded below.

## Outcome

Typing `cosmos`, or submitting that phrase through a discreet footer prompt, opens an orbital notebook. A fixed star attracts three initial planets and any planets the visitor launches. Fine trails reveal their paths. The playground supports mouse, touch, keyboard, both site themes, reduced motion, and clean return to the visitor's reading position.

The user authorized writing this plan directly because the `writing-plans` skill is unavailable. This plan has no dependency on another planning or execution skill. Work through the tasks in order using the existing workspace.

## Constraints and current evidence

- `~/.local/bin/zola` reports **0.21.0**. Use this binary and put its directory first in PATH for Python smoke checks. Homebrew's newer Zola is incompatible with this site.
- Node **26.10.0** and Python are available. Node's built-in test runner can exercise the physics module without a package manager, bundler, or new dependencies.
- `templates/base.html` loads the current theme script and includes the inherited footer inside its `footer` block. Add the launcher alongside that include; do not copy or edit the Terminus footer.
- The workspace already contains uncommitted blog redesign changes, including the base template, theme palettes, stylesheet entry point, README, and smoke checks. Preserve them. Avoid whole-tree staging, resets, stashes, and replacing files with versions from HEAD.
- Keep changes outside `themes/terminus`. Preserve the content model, feeds, deployment workflow, and Zola configuration.
- Build artifacts remain in ignored `public/`. Visual-companion artifacts remain in ignored `.superpowers/`.
- Use `rtk` for shell commands. This plan's commands assume the current checkout directory, whose name ends with a space.

## File map

| File | Action and responsibility |
| --- | --- |
| `static/js/cosmos-physics.js` | Create: deterministic world state, star gravity, integration, body lifecycle, bounded trails. |
| `static/js/cosmos.js` | Create: Canvas drawing, input, controls, frame scheduling, theme/resize/visibility handling. |
| `static/js/cosmos-trigger.js` | Create: phrase recognition, footer prompt, dialog lifetime, lazy loading, focus/scroll restoration. |
| `templates/partials/cosmos-launcher.html` | Create: initially hidden footer launcher and Zola-generated module URL configuration. |
| `templates/base.html` | Modify: activation script and local launcher include. |
| `sass/css/_variables.scss` | Modify: dedicated cosmos colors in both existing theme maps. |
| `sass/css/_cosmos.scss` | Create: scoped tokens, prompt, full-window dialog, controls, canvas, focus and responsive rules. |
| `sass/css/style.scss` | Modify: load the cosmos partial after existing local styles. |
| `tests/cosmos-physics.test.mjs` | Create: numerical and behavioral physics tests with `node:test` and `node:assert/strict`. |
| `tests/site_smoke.py` | Extend: generated launcher/script presence and local asset checks while retaining existing route/feed checks. |
| `README.md` | Extend: concise maintainer instructions, controls, module locations, and verification commands. |

## Component contracts

**Physics:** export a small `createSimulation()` factory. Its instance provides `step(dt)`, `launch(position, velocity)`, `reset()`, and `snapshot()`. The snapshot exposes world constants, bodies, and trails as read-only data to consumers. Launch returns a structured outcome, including capacity replacement; stepping reports body removals where useful for status updates. Physics code must not reference DOM, Canvas, browser time, or device pixels.

**Playground:** export `mountPlayground({ host, signal, onFatalError })`, returning `{ dispose, cancelAim }`. The host is the shell's content container. The shell owns the close control; the playground owns Canvas and its pause/reset/launch controls. `cancelAim()` reports whether it cancelled an active aim, so the shell can implement Escape priority. `dispose()` must be safe to call more than once.

**Activation/shell:** use one startup script with no eager import of the playground or physics. It owns prompt/opening/open/error/closed transitions, a generation token for asynchronous opens, the invoking element, and scroll restoration. Use native modal dialogs for focus containment and background inertness, with explicit initial focus and restoration. Create the dialog directly under `body` to avoid inherited footer layout constraints.

Input becomes a world-space launch vector; physics advances that state; the renderer reads a snapshot. Keep the drawing loop and dialog lifetime out of the physics module.

## Task 1 — Establish the implementation baseline

- [ ] Read `AGENTS.md`, the approved spec, and the current contents of every existing file before changing it.
- [ ] Record `rtk git status --short` and inspect the existing diffs for the shared files in the file map. Treat these changes as the working baseline.
- [ ] Confirm the toolchain with `rtk proxy "$HOME/.local/bin/zola" --version` and `rtk proxy node --version`.
- [ ] Run `rtk proxy env PATH="$HOME/.local/bin:$PATH" python3 tests/site_smoke.py` once before implementation. Record any baseline failure separately; resolve a prerequisite only when it blocks this feature.

**Done when:** the existing site baseline and pre-existing edits are understood, and implementation uses Zola 0.21.x.

## Task 2 — Implement and verify the physics module

- [ ] Define central constants and deterministic seeds. Start with dimensionless `mu = 1`, star radius `0.1`, seed radii `0.55`, `0.95`, and `1.4`, and different initial angles. Initialize circular velocities from `sqrt(mu / radius)`.
- [ ] Use velocity Verlet with a fixed step of `1/240` simulated seconds. Keep the frame accumulator in the controller, not in physics. The values above are initial tuning choices; retain the approved numerical accuracy if tuning them.
- [ ] Before acceleration evaluation, reject non-finite state and bodies inside the star. During integration, test the segment from old to candidate position against the star disc before calculating the next acceleration, preventing a fast body from crossing the star between samples.
- [ ] Remove bodies beyond eight times the outer seeded radius. Do not remove a body merely because it is off-screen. Do not compute mutual forces or planet-to-planet collisions.
- [ ] Implement launch and reset through the public contract. Validate finite vectors and clamp speed to one shared maximum, initially `4` world units per simulated second. At 24 bodies, replace the oldest surviving visitor-launched body before adding another; never replace a seed for capacity management.
- [ ] Bound each trail to 180 samples, initially sampled every `1/60` simulated seconds. Seed bodies and newly launched bodies get the same trail rules. Reset clears trails and recreates the deterministic seeds.
- [ ] Add tests for all three circular seeds: after ten orbital periods, maximum relative radius drift and relative specific-energy drift are each below 1%. Use analytic initial radius and energy as the reference, not a second copy of the integrator.
- [ ] Add behavioral tests for zero-speed infall, a fast segment crossing the star, escape removal, an off-screen but retained bound orbit, capacity replacement order, trail limits, reset, and invalid launch data. Verify adding a second planet does not change an existing planet's computed trajectory.
- [ ] Run `rtk proxy node --test tests/cosmos-physics.test.mjs`; investigate any failed physical invariant before moving on.

**Done when:** the simulation meets the spec's orbit tolerance and lifecycle rules independently of a browser.

## Task 3 — Build the orbital notebook view

- [ ] Create the playground module and return the documented disposal interface. Keep rendering, coordinate transforms, input state, and frame scheduling in named local functions with clear responsibilities.
- [ ] Draw a simple central star, three faint circular guides, small planet discs, actual fading trails, a static sparse star background, and a faint grid. Generate background points deterministically once per opening; they must not flicker on redraw.
- [ ] Fit the world to the actual canvas container using the shorter dimension, leaving room around the outer seeded orbit. Use a stable world coordinate system with upward-positive Y, converting explicitly to downward-positive screen Y for rendering and pointer input.
- [ ] Cap backing-store pixel density at 2. Keep CSS layout size separate from backing-store resolution. Set a consistent world-space display radius per body, with a minimum visible pixel radius where necessary; hit-testing uses the actual drawn radius.
- [ ] Add pause/resume, reset, launch, status, and concise help elements. The shell supplies title and close. Use semantic DOM controls and status text rather than painting controls into Canvas.
- [ ] Implement an accumulator with fixed physics steps, a starting rate of `0.28` simulated seconds per real second, and a maximum of 24 steps per frame. Discard excess catch-up time. Pausing stops simulation and trail updates; redraw only when input, layout, or appearance changes.
- [ ] Read colors from resolved cosmos CSS custom properties. Observe `body[data-theme]` changes and redraw without touching the site's theme preference code.

**Done when:** mounting the controller creates the selected orbital sketch, with deterministic seed motion and a working disposal path. Browser inspection follows integration in Task 6.

## Task 4 — Add launch input and lifecycle behavior

- [ ] Implement one pointer aim state. Press chooses a valid spawn point, movement changes velocity, and release launches at the original point toward the release point. Translate distances through the world transform so launch strength does not vary with pixel density. Show the clamped velocity arrow.
- [ ] Reject presses on the star or a currently drawn planet. Capture the active pointer, accept only that pointer until completion, and release capture on completion, cancellation, resize, reset, or disposal. Ignore additional touches during an aim.
- [ ] Handle `pointercancel` and unexpected loss of capture without launching. Releasing outside the canvas still finishes a captured drag. Apply `touch-action: none` to the canvas only.
- [ ] Implement keyboard aiming from **Launch planet**. Focus the aiming surface, start at a valid point near the middle orbit, and let arrows move the point; Shift increases the increment. Enter validates position and enters velocity mode with the local circular tangential vector. Arrows then change vector components and Enter launches.
- [ ] Apply the same speed cap, collision exclusion, and launch API for both input methods. In keyboard mode, keep position within the canvas. Tab out cancels the keyboard aim; Escape cancels an aim before the shell closes anything.
- [ ] Keep pending aim state out of the simulation. Reset cancels aiming and preserves pause intent. Allow launching while paused, drawing the new stationary state immediately.
- [ ] Implement reduced motion as an initial paused state, with explicit Resume still available. A later change to reduced motion pauses; changing back does not resume automatically.
- [ ] Track user pause intent separately from document visibility. Hidden documents have no running animation callback; returning to visibility resets frame timing and resumes only when intended. Do not simulate hidden elapsed time.
- [ ] On resize, cancel aiming and update only canvas dimensions and transforms. Keep positions, velocities, and trails intact. Dispose observers, media-query callbacks, frames, input listeners, and pointer capture on close or fatal error.
- [ ] Supply an accessible canvas description, stage-specific keyboard help, and a status summary. Announce launches, replacements, reset, and errors without streaming orbital coordinates or every removal to a live region.

**Done when:** pointer and keyboard share the same launch behavior, and all time/input resources have explicit cleanup ownership.

## Task 5 — Implement phrase recognition and the modal shell

- [ ] Recognize the case-insensitive rolling six-letter phrase `cosmos`; expire it after three seconds between eligible letters and clear it on blur. Ignore editable targets, open dialogs, composition, repeats, and Ctrl/Meta/Alt shortcuts. Check composed event paths for editable targets; clear partial input when entering an ignored editing context. Allow uppercase through Shift.
- [ ] Keep startup lightweight. Reveal the footer button only after handlers are attached. Read the playground URL from the launcher's template-generated configuration and import it only on a match or valid prompt submission.
- [ ] Implement the labelled command prompt with field, submit, and close. Trim submitted text, accept `cosmos` case-insensitively, and show **Unknown command.** for other submissions. Capture the original footer button and scroll position once, preserving them through transition to the playground.
- [ ] Replace the prompt with the playground shell rather than stacking dialogs. Use `showModal()` for background inertness and focus containment, explicitly focus a sensible initial element, and keep a close control available during loading.
- [ ] Store a generation token and per-opening abort controller. Closing invalidates pending loads; a late import resolution must not mount UI. Guard repeated activation so only one dialog and simulation can exist.
- [ ] Route native dialog cancel events through `cancelAim()` first. If no aim is active, close and dispose. Restore prior scroll and focus without scrolling to the footer; direct typing with no useful focus target should restore document focus safely.
- [ ] Handle import rejection, unavailable Canvas context, and runtime failure with the spec's short error message. Stop active work but retain a usable close button. Ensure a new opening can retry initialization; explain reload if a browser has cached an unrecoverable module evaluation failure.
- [ ] Keep both ordinary closing and partial-initialization cleanup idempotent. An error during drawing or integration must not bypass shell cleanup.

**Done when:** the secret phrase and prompt enter the same controlled lifecycle, including interruption, failure, and focus restoration.

## Task 6 — Integrate templates and both themes

- [ ] Add the local launcher partial inside the existing footer block, after `partials/footer.html`. Keep the inherited include intact. Initially hide the launcher with a real `hidden` attribute.
- [ ] Add the deferred activation script beside the existing local scripts in `templates/base.html`, using `get_url(..., cachebust=true)`. Put the Zola-generated playground URL on the launcher as a data attribute. Use a relative ES-module import for the physics dependency so subpath hosting works.
- [ ] Add dedicated cosmos entries to the existing dark/light palette maps: star, secondary planet, guide, grid, and muted UI colors as needed. Export scoped CSS variables from `_cosmos.scss`; use the shared background and text values. Avoid hard-coded drawing colors in JavaScript.
- [ ] Load `_cosmos.scss` after `_streams.scss`. Scope all selectors to the feature. Ensure `[hidden]` is not overridden by a generic button/display rule.
- [ ] Style a viewport-filling playground dialog with `100dvh`, safe-area padding, a flexible canvas region, compact wrapping controls, and visible focus rings. Keep the command prompt compact. Reset native dialog max-width/max-height/margins as needed. Ensure tiny and landscape viewports can reach every control.
- [ ] Preserve reading position during scroll locking on desktop and mobile. Scope restoration to properties this feature changed, restoring their previous values on every exit.
- [ ] Extend `tests/site_smoke.py` using Python's HTML parser or decoded attributes, because Zola escapes slashes. Check one hidden launcher and one activation script per expected shared-template route, valid local module URLs, and existence of all three JavaScript assets in `public/`. Retain the original content and feed assertions.
- [ ] Run `rtk proxy env PATH="$HOME/.local/bin:$PATH" python3 tests/site_smoke.py` after the template/style integration. Expected: existing routes/feeds and new feature wiring pass under Zola 0.21.x.

**Done when:** the feature is reachable through every shared-template page, and both palettes render through the existing style system.

## Task 7 — Verify the complete experience in the browser

Start the local site with `rtk proxy "$HOME/.local/bin/zola" serve --interface 127.0.0.1 --port 1111`. Use the browser's native controls or available browser tooling for the following checks. Record actual outcomes; a static screenshot is insufficient evidence for interaction or cleanup.

| Area | Action and expected result |
| --- | --- |
| Ordinary visit | Load the homepage and a content page. Only activation code loads; the playground and physics modules are absent from network requests until activation. No animation runs. |
| Phrase filtering | Type `cosmos` and uppercase variants. Slow typing beyond the timeout, input fields, composition, and modifier shortcuts must not open it. Test interrupted partial phrases. |
| Footer prompt | Enter an invalid command, then ` cosmos `. Confirm the error, successful activation, mobile keyboard dismissal, and return focus to the footer button on close. |
| Launch | Try a short tangential drag, a fast escape, and zero-length infall. The arrow direction agrees with the launch, trails show real motion, and star impacts remove bodies cleanly. |
| Keyboard | Complete both aiming stages without a mouse, cancel each with Escape, Tab out of aiming, then close. Focus stays in the dialog until closing. |
| Capacity | Launch beyond the 24-body limit. Count stays bounded and the oldest visitor body is replaced. Reset returns to three seeds. |
| Pause and timing | Pause, launch while paused, reset while paused, resume, hide the tab, and return. No hidden-time jump occurs. |
| Reduced motion | Open with reduced motion enabled, explicitly resume, then change the preference while open. Apply the specified pause behavior without an automatic resume on disabling the preference. |
| Layout/theme | Check 1440×900, 390×844, and 844×390 layouts in both themes. Test touch input where available, pointer release beyond the canvas, resizing mid-aim, high pixel density, control reachability, and text/focus contrast. |
| Restoration | Open from a deeply scrolled article and close repeatedly. Scroll and focus return correctly; page links and scrolling work again. |
| Async loading | Throttle the module request, open then close before it completes, and activate repeatedly. No late or duplicate dialog appears. |
| Failures | Temporarily block the module request using browser network controls, and exercise Canvas initialization failure with a temporary development-only diagnostic. Verify the usable error shell, cleanup, and later recovery; remove diagnostics before completion. |
| Resource cleanup | Use browser performance/network inspection across repeated opens and closes. Confirm no active drawing callbacks, growing playground listeners, stray dialogs, or retained body/trail collections after closing. Cached module code is expected. |

- [ ] Complete the matrix and fix observed failures. Re-run only the affected checks after a targeted fix, plus any tests affected by changed physics/templates.
- [ ] If a browser capability cannot be exercised in the available environment, record the precise gap rather than reporting it as passed.
- [ ] Stop the local preview server after inspection.

**Done when:** the browser checks support the spec's controls, accessibility, performance, and failure requirements, with any remaining gaps explicitly documented.

## Task 8 — Document and finish

- [ ] Add a short maintainer section to `README.md` describing `cosmos`, the footer prompt, pointer/keyboard controls, reduced motion, the three module responsibilities, and the physics test command. Keep implementation detail out of the visitor-facing help.
- [ ] Run the physics tests after final physics edits: `rtk proxy node --test tests/cosmos-physics.test.mjs`.
- [ ] Run the required site smoke check after final template or configuration edits: `rtk proxy env PATH="$HOME/.local/bin:$PATH" python3 tests/site_smoke.py`. Do not duplicate a just-completed successful run when no relevant files changed.
- [ ] Run `rtk git diff --check`, inspect the feature diff, and verify the theme submodule and deployment workflow were not changed. Compare the final status with the recorded baseline.
- [ ] Mark completed plan checkboxes and summarize the feature, verification evidence, and any remaining gaps. If committing implementation work, stage only new feature files and feature-specific hunks in already-dirty files; do not include unrelated redesign work.

**Done when:** the approved experience is implemented, its meaningful checks pass, and the final report accurately distinguishes measured behavior from remaining uncertainty.

## Plan review

- Spec coverage: activation and lazy loading (Task 5); physics and lifecycle invariants (Task 2); visuals (Tasks 3 and 6); pointer/keyboard and motion behavior (Task 4); dialog accessibility and restoration (Tasks 5–7); failure handling and cleanup (Tasks 4, 5, and 7); Zola integration and regressions (Tasks 1, 6, and 8).
- Dependencies: physics precedes the view; view contracts precede shell integration; full browser checks follow template wiring. Each task has named files through the file map, concrete actions, and an observable completion condition.
- Scope: no new framework, build pipeline, mutual gravity, persistence, audio, or deployment change. Verification uses the existing site checks and focused numerical tests.
- Workspace safety: implementation starts from the current dirty workspace and isolates feature changes during any later commit.
- This plan was reviewed for completeness and consistency. Implementation results and remaining browser checks are recorded below.

## Implementation results — 2026-09-26

- Implemented the physics, Canvas playground, phrase trigger, accessible prompt/dialog, theme colors, templates, responsive styles, smoke-check coverage, and README instructions listed in this plan.
- `node --test tests/cosmos-physics.test.mjs`: **10 passed**. All three circular-orbit cases remain within 1% radius and energy drift for ten periods.
- `node --check` passed for all three JavaScript modules.
- `python3 tests/site_smoke.py` with Zola 0.21.0: **passed**; five routes, three feeds, and playground wiring across six shared pages. A network-enabled check was used because this existing site check fetches the external GitHub profile link.
- `git diff --check`: passed.
- Browser checks covered lazy loading, phrase filtering in editable inputs, invalid and valid prompt entries, modal appearance, mobile layout at 390 × 844, keyboard launch, pause/reset, Escape cancellation/close, focus restoration, dark/light rendering, and cleanup of dialogs and scroll-lock styles after repeated opens. Browser checks interrupted by user activity were not repeated against the user's active browser.
- Still unverified in a browser: physical pointer/touch drags and pointer-capture cancellation, reduced-motion preference changes, hidden-tab pause/resume, 844 × 390 layout, close while a deliberately throttled import is pending, injected import/Canvas/runtime failures, and live animation-frame/listener/memory measurements.
- The implementation is not committed. The checkout already contained unrelated, uncommitted site-redesign files; those changes were preserved.

The remaining manual browser items do not invalidate the passing deterministic physics tests or generated-site checks, but should be exercised before treating the playground as fully browser-verified.
