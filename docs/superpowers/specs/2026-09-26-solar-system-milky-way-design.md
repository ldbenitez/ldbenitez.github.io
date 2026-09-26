# Solar System and Milky Way

## Experience

Extend the existing `cosmos` dialog with three plainly labelled view buttons: Playground, Solar System, and Milky Way. Open on Solar System. Keep the current launchable gravity playground available through its button.

Direction: an illustrative model that prioritizes discovery and readability. Display a short scale note: sizes, distances, and time are compressed. This is not a model of current planetary positions. The user requested direct experimentation and waived further design approval gates.

## Solar System

Show the Sun and all eight planets in their correct order. Give planets distinctive colors, Saturn its rings, Earth a small Moon, and add a faint asteroid belt between Mars and Jupiter. Use stable prescribed orbits, with inner planets visibly faster than outer planets. Compress the spread of orbital speeds so outer planets visibly move during a short visit; do not label elapsed time as real days or years.

Allow planet selection by pointer and by a native select control with a visible label. Selection shows a brief fact and highlights the planet. Use a shared speed control, Pause/Resume, and Reset. Launch controls apply only to Playground. Avoid persistent canvas labels that collide on small screens; show the selected planet label and provide all names in the selector.

## Milky Way

Render a stylized barred spiral galaxy with a bright central bulge, a few thousand bounded star particles, broad spiral arms, and subtle dust lanes. Use a flattened, inclined view for depth. Slowly rotate the illustrative pattern; do not claim to model individual stellar dynamics or a measured star map.

Mark the Solar System away from the center. Selecting its marker, or a clearly labelled button, opens the Solar System view. Provide a concise explanation of the different scale. Keep transitions simple: switching views needs no elaborate zoom machinery.

## Implementation boundaries

Reuse Canvas, the existing modal lifecycle, theme palettes, and animation clock. Put astronomical scene data and rendering in a separate module so the existing gravity integrator remains unchanged. Extend the planet painter to accept an explicit palette color and ring flag while retaining its existing playground defaults.

Use deterministic procedural stars and no external assets or dependencies. Allocate galaxy particles once, keep counts fixed, and use inexpensive drawing operations. Avoid per-frame DOM updates. Both themes must keep bodies, controls, and annotations legible.

Pause freezes every view. Hidden tabs stop animation. Reduced motion starts paused and suppresses decorative twinkling and parallax. View changes cancel launch aiming, update accessible descriptions, and preserve keyboard focus. The select and Solar System navigation button provide alternatives to canvas hit targets. Reset restores the active scene and its initial selection; it does not clear unrelated view state.

## Verification

Retain all existing physics tests. Add focused checks for the orbital model's finite positions, ordering, deterministic reset, and bounded galaxy generation. Run the Zola 0.21 smoke suite including the new module. Inspect both themes and mobile layout, and exercise view switching, planet selection, galaxy navigation, speed, pause, reset, reduced motion, and dialog cleanup in a browser.
