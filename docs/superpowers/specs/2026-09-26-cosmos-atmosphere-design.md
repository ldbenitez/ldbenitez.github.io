# Cosmos atmosphere

Enhance the approved gravity playground with depth and small surprises. The user approved layered stars, lighting, varied orbital motion, and occasional celestial events, and asked to keep the implementation simple.

Keep the existing Canvas renderer and gravity simulation. A small rendering module adds three star depths with gentle pointer parallax and twinkling, sun-facing planet lighting, a ring around the second seed planet, a breathing solar halo, and a rare meteor. Impacts briefly expand the solar halo. Existing gravitational speeds and trajectories remain authoritative; decorative effects do not move hit targets.

Use the existing theme palette. Keep decorations in the existing requestAnimationFrame loop, freeze them on Pause and hidden tabs, and suppress decorative motion under reduced motion even if the visitor explicitly resumes the physics. Reset clears effect time and impact state. No dependencies, assets, timers, new controls, or changes to the site's reading view.

Validate with existing physics tests, the Zola 0.21 site smoke check, and browser inspection of dark/light themes, launch/reset/pause, reduced motion, and a narrow viewport.
