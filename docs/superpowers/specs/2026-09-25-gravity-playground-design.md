# Gravity Playground — Design Specification

**Date:** 2026-09-25  
**Status:** Experience and technical design approved in conversation; written specification awaiting review.

## Purpose

Add a hidden, interactive astronomy experience to `lbenitez.dev`. A visitor enters the secret phrase `cosmos` and discovers a small gravity playground styled as an orbital notebook. Launching planets makes gravity visible through trajectories, stable orbits, impacts, and escapes.

The ordinary blog remains a writing-first Zola site. The playground opens only through deliberate activation and restores the visitor's reading position when closed.

## Approved direction

- Activation: a secret phrase, with a discreet footer prompt for mobile and keyboard access.
- Experience: an interactive gravity playground.
- Appearance: visual direction A, **Orbital notebook** — fine trajectories, restrained planetary shapes, monospaced details, warm colors.
- Gravity: a fixed central star attracts every planet; planets do not attract or collide with each other.
- Presentation: a full-window overlay, initially showing one star and three orbiting planets.
- Controls: drag and release to launch, keyboard launch controls, pause, reset, and close.
- Implementation: plain JavaScript and Canvas, with simulation and rendering loaded on demand.

The approved dark concept used an amber star on charcoal. The implementation must express this through the existing Sass palette system; the current general dark accent is brighter orange, so add dedicated cosmos palette entries if needed to reproduce the approved amber. Light mode uses warm paper and rust. Do not alter the blog's general palette to accommodate the playground.

## Discovery and activation

### Typing the phrase

On pages using the shared base template, a lightweight listener recognizes `cosmos` case-insensitively. Maintain a rolling buffer of at most six letters, cleared after three seconds between eligible keystrokes or on loss of window focus.

Ignore typing inside inputs, textareas, selects, editable regions, or another open dialog. Ignore composition events, repeated key events, and Ctrl/Meta/Alt combinations; modifier shortcuts and non-letter keys clear the partial phrase. Shift is allowed for uppercase letters. Do not prevent ordinary keyboard behavior.

On a match, clear the buffer and open the playground once. Ignore further phrase input while its prompt or playground is open. Nothing entered is persisted or sent anywhere.

### Footer prompt

Add a small `>_` button to the shared footer with accessible name **Open command prompt**. It opens a labelled dialog with one text field, a submit button, and a close control. Submitting the trimmed, case-insensitive phrase `cosmos` opens the playground. Other text produces **Unknown command.** without revealing the answer.

This is an alternative way to enter the same secret phrase on touch devices or with assistive technology. The footer button is only exposed when its JavaScript handler is available. Existing footer social links and copyright remain intact.

## Experience and controls

### Opening and closing

Opening presents a viewport-filling dialog titled **Orbital notebook**, with `~/cosmos` as a small visual label. A central star and three seeded planets are visible immediately after loading. The simulation starts unless reduced motion is requested.

The background page is inert while the dialog is open. Preserve its scroll position and the invoking focus target. Keep focus within the dialog; closing restores scroll and focus. When the footer prompt transitions into the playground, preserve the original footer button as the return target and replace the prompt rather than stacking dialogs. When direct phrase typing has no useful focus target, restore the prior document focus without scrolling.

Closing destroys the active simulation state. Each subsequent opening starts a fresh three-planet system. No session is saved. Navigation and browser history are unaffected.

### Pointer and touch launch

1. Press on empty canvas space to choose the spawn position.
2. Drag from that point to set the initial velocity. The arrow points from the press position toward the current pointer position; this is the direction the planet will travel.
3. Release to create the planet at the original press position. Longer drags produce higher speeds, up to a finite maximum.

The preview is a velocity arrow, not a prediction of the future orbit. A zero-length drag creates a stationary planet that falls toward the star. Reject spawn points inside the star or an existing planet's visible disc. Planets cannot be grabbed or moved.

Use pointer capture so releasing beyond the canvas completes the drag. Pointer cancellation abandons the launch. Prevent touch scrolling only on the active playground canvas; controls remain usable with normal touch behavior.

### Keyboard launch

Provide a visible **Launch planet** button alongside the other controls. It starts a two-stage aiming mode with concise instructions and a visible crosshair:

1. Arrow keys move the spawn point; Shift plus an arrow moves it farther. Enter confirms a valid position.
2. Arrow keys adjust the horizontal and vertical components of the velocity arrow; Shift makes larger changes. Enter launches the planet and returns focus to **Launch planet**.

Reject invalid positions using the same rules as pointer input. Start the velocity stage with a tangential vector at the circular speed for the chosen radius, clamped to the shared speed limit; allow adjustment down to zero. Clamp position to the visible canvas and speed to the same maximum as pointer input. Consume these keys only while the aiming surface has focus.

Escape first cancels an active pointer or keyboard aim. Otherwise it closes the active dialog. Tab remains available for navigation and cancels any unfinished keyboard aim when focus leaves the aiming surface.

### Other controls

- **Pause / Resume:** stop or restart simulated time and trail updates. Aiming and adding a planet remain possible while paused; it starts moving when resumed.
- **Reset:** restore the initial three planets and clear all trails and pending aiming state. Preserve the current paused/running choice.
- **Close:** cancel pending input, dispose of the playground, and return to the blog.

Use visible text, semantic buttons, and clear focus indicators. Keep the layout compact and let controls wrap on small screens without obscuring the simulation.

## Physics and lifecycle

Use a two-dimensional world in illustrative, dimensionless units. The star remains fixed at the origin. Each planet has a position, velocity, display radius, bounded trail, and identity; no planet mass is needed because the planets exert no force.

Acceleration follows `a = -mu * r / |r|^3`, where `r` is the vector from the star to the planet and `mu` is the star's fixed gravitational parameter. Use a fixed simulation step with a stable orbital integrator such as velocity Verlet. Rendering cadence must not determine the physical timestep. Limit catch-up work after a delayed frame and discard excess accumulated time to avoid a long stall.

Seed three circular orbits at different radii using the corresponding circular velocities. Choose their visual scale and time rate so motion is readily visible and comfortable to watch. Launch speed is adjustable; gravity strength, planet mass, and simulation speed have no user-facing sliders in this version.

Remove a planet when its center's path intersects the star's collision disc. Detect crossings over a simulation step so a fast planet cannot tunnel through the star. Remove it before a singular distance can enter the force calculation. Remove bodies farther than eight times the outer seeded orbit radius; merely leaving the visible canvas does not remove a bound orbit.

Planets pass through each other. Impacts have no explosion, sound, or camera shake; the body and its trail disappear. Remove any body whose state becomes non-finite so a numerical error cannot poison the remaining simulation.

Allow at most 24 planets, including the three seeds. At capacity, a new launch replaces the oldest surviving visitor-launched planet. Keep trails bounded in length and sampled by simulation time. These limits prevent indefinite memory growth.

Keep physics coordinates independent of screen pixels. Resizing updates the world-to-screen transform and cancels an unfinished aim without resetting the system or changing velocities. Scale the view so all three initial orbits fit the available canvas in portrait and landscape layouts.

## Visual treatment

Use the site's monospaced typography, palette variables, fine lines, and restrained spacing. Draw a simple filled star and small planet discs. Trails show actual recent positions and fade toward their older ends. Include faint circular guides for the three seeded orbits. These guides are static references; visitor-launched planets follow their own simulated paths.

Use a sparse, static star background and a very faint diagram grid, keeping the moving planets and launch arrow easy to distinguish. Avoid bloom, textures, photorealistic planets, and dense data panels. The scene should resemble the approved orbital sketch.

Read drawing colors from CSS custom properties derived from the Sass theme maps. Match the current theme at opening, and update if the page theme changes while open. Differentiate the star, planets, and aiming arrow through shape or line treatment as well as color.

## Motion, performance, and accessibility

- With `prefers-reduced-motion: reduce`, open paused with **Resume** available. Use no decorative entrance animation or moving background.
- If reduced motion becomes enabled while open, pause. Disabling it does not automatically resume.
- On document hiding, suspend the animation loop. On return, resume only if the user had left the simulation running and reduced motion has not subsequently paused it. Reset timing so hidden elapsed time is not simulated.
- On close, cancel animation frames, detach playground input/resize/theme listeners, release pointer capture, remove the dialog, and clear trails and bodies. The lightweight site activation listener remains.
- Cap canvas pixel density at 2 to bound rendering work on high-density screens.
- Provide text instructions, a Canvas description, and an accessible status summary with the number of planets and pause state. Announce launches, resets, capacity replacement, and errors; do not continuously announce every physics step or trajectory point.
- Keep a visible, keyboard-accessible close control during loading and failure states.

## Architecture and integration

Three focused components own the feature:

1. **Activation and dialog shell** (`static/js/cosmos-trigger.js`): recognizes the phrase, manages the footer prompt, mounts the loading/dialog shell, restores scroll and focus, and lazily imports the playground. It does not perform physics or drawing.
2. **Simulation** (`static/js/cosmos-physics.js`): owns bodies, gravity integration, bounded trails, launches, removal, and reset. It has no DOM or Canvas dependency and accepts simulation steps and launch vectors through a small API.
3. **Playground view/controller** (`static/js/cosmos.js`): mounts Canvas and controls, maps input into world coordinates, advances simulation, renders snapshots, handles theme/resize/visibility changes, and exposes one cleanup operation to the shell.

Data flows from pointer/keyboard input to a world-space launch vector, into the simulation, and then into rendered positions and trails. The shell controls the lifetime of this loop.

Load only the small activation script on normal pages. Load the playground module and its physics dependency after activation, from local static assets. A closing action during module loading invalidates that opening request; a late module resolution must not reopen a dismissed dialog. Repeated activation must not create multiple dialogs or loops.

Integrate through the existing footer block in `templates/base.html`: retain the inherited footer include and append a local cosmos launcher partial. The existing footer comes from Terminus; no theme submodule edit or duplicate footer implementation is needed. Add `sass/css/_cosmos.scss` after the existing local partials, with any new palette values in `_variables.scss`.

Use Zola-generated asset URLs that continue to work under a configured base URL. Use external, same-origin scripts and assets, without requiring broader content-security-policy permissions. Preserve Zola 0.21.x, Markdown publishing, and the current deployment workflow.

## Failure handling

If the playground module fails to load or Canvas cannot initialize, retain the shell and display **The playground could not start. Please close it and try again.** Closing must still restore page interaction, scroll, and focus. A later activation may retry.

If a fatal error occurs after startup, stop the simulation loop and show the same usable error state. If only a single body's numerical state is invalid, remove that body and continue. Do not leave a blank full-window overlay trapping the visitor.

## Scope boundaries

This version contains no mutual gravity, planet-to-planet collisions, 3D camera, sound, scoring, accounts, persistence, shareable systems, mass controls, gravity sliders, or orbital prediction engine. The visual companion's decorative motion was illustrative; implementation uses the specified simulation.

## Verification and acceptance

1. Both direct typing and the accessible footer prompt recognize `cosmos` on shared-template pages. Editable fields and browser shortcuts do not trigger it.
2. Opening creates one star and three stable orbits, with the selected orbital-notebook appearance in both themes.
3. Pointer, touch, and keyboard input can launch a planet with controllable position and velocity. The displayed arrow matches the initial velocity direction.
4. Ordinary launches can produce bound orbits, star impacts, and escapes. Circular-orbit numerical checks keep radius and orbital energy within 1% drift over ten simulated orbital periods at the chosen timestep; star-crossing and escape cases terminate safely.
5. Planet count never exceeds 24, and each trail stays bounded. A capacity launch replaces the oldest visitor-launched planet.
6. Pause, reset, reduced motion, background suspension, resize, and repeated open/close cycles behave as specified. No hidden elapsed time is simulated on return.
7. Keyboard focus stays within an active dialog. Escape, close, load failures, and runtime failures return the visitor to the previous reading position with a usable page.
8. A normal page visit does not load the drawing or physics module or start an animation loop. Closing leaves no active playground loop or playground-specific listeners.
9. Manually inspect desktop and a narrow touch viewport, keyboard-only operation, dark/light palettes, and reduced motion. Exercise actual input and lifecycle transitions rather than relying on screenshots alone.
10. After implementation changes templates, run `tests/site_smoke.py` with `~/.local/bin` first in PATH and confirm Zola 0.21.x is used. Its existing checks cover content routes and section feeds; supplement with meaningful physics and browser behavior checks for this feature.

This documentation-only step does not run builds or claim implementation verification. Implementation planning follows review of this written specification.
