import { createSimulation, WORLD, circularVelocity, limitVelocity } from './cosmos-physics.js';
import { createScenery } from './cosmos-art.js';
import { createAtlas, PLANETS } from './cosmos-scenes.js';

const RATE = 0.28;
const DRAG_GAIN = 1.8;
const DEFAULT_HELP = 'Drag and release to launch a planet. Longer drags launch faster.';

export function mountPlayground({ host, signal, onFatalError }) {
  host.innerHTML = `
    <div class="cosmos-views" role="group" aria-label="Explore space">
      <button type="button" data-view="solar" aria-pressed="true">Solar System</button>
      <button type="button" data-view="galaxy" aria-pressed="false">Milky Way</button>
      <button type="button" data-view="blackhole" aria-pressed="false">Black Hole</button>
      <button type="button" data-view="playground" aria-pressed="false">Playground</button>
    </div>
    <div class="cosmos-atlas-info">
      <label data-solar-control>Explore <select data-planet aria-label="Select a planet">
        ${PLANETS.map((planet, index) => `<option value="${index}" ${index === 2 ? 'selected' : ''}>${planet.name}</option>`).join('')}
      </select></label>
      <button type="button" data-action="home" hidden>Visit the Solar System →</button>
      <p class="cosmos-fact" aria-live="polite"></p>
    </div>
    <div class="cosmos-stage">
      <canvas class="cosmos-canvas" tabindex="0" role="img" aria-label="Gravity playground"
        aria-describedby="cosmos-description cosmos-help"></canvas>
      <p id="cosmos-description" class="cosmos-sr">A fixed star attracts orbiting planets.
        Launch with a drag, or use the Launch planet button for keyboard aiming.</p>
    </div>
    <div class="cosmos-toolbar">
      <div class="cosmos-actions">
        <button type="button" data-action="launch">Launch planet</button>
        <button type="button" data-action="pause">Pause</button>
        <button type="button" data-action="reset">Reset</button>
        <label class="cosmos-speed" hidden>Speed <select data-speed aria-label="Animation speed">
          <option value="0.25">¼×</option><option value="1" selected>1×</option>
          <option value="4">4×</option><option value="12">12×</option>
        </select></label>
      </div>
      <p class="cosmos-summary"></p>
    </div>
    <p id="cosmos-help" class="cosmos-help"></p>
    <p class="cosmos-sr" aria-live="polite" aria-atomic="true" data-announcement></p>`;

  const canvas = host.querySelector('canvas');
  const dialog = host.closest('.cosmos-dialog');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const launchButton = host.querySelector('[data-action="launch"]');
  const pauseButton = host.querySelector('[data-action="pause"]');
  const resetButton = host.querySelector('[data-action="reset"]');
  const summary = host.querySelector('.cosmos-summary');
  const help = host.querySelector('#cosmos-help');
  const announcement = host.querySelector('[data-announcement]');
  const viewButtons = [...host.querySelectorAll('[data-view]')];
  const planetSelect = host.querySelector('[data-planet]');
  const solarControl = host.querySelector('[data-solar-control]');
  const homeButton = host.querySelector('[data-action="home"]');
  const fact = host.querySelector('.cosmos-fact');
  const info = host.querySelector('.cosmos-atlas-info');
  const speedSelect = host.querySelector('[data-speed]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  const scenery = createScenery(context);
  const atlas = createAtlas(context, scenery);
  let view = 'solar';
  let speed = 1;
  let simulation = createSimulation();
  let paused = motion.matches;
  let reducedMotion = motion.matches;
  let disposed = false;
  let frame = null;
  let lastTime = null;
  let accumulator = 0;
  let width = 1;
  let height = 1;
  let scale = 1;
  let density = 1;
  let aim = null;
  let colors = {};
  let resizeObserver;
  let themeObserver;

  function announce(message) { announcement.textContent = message; }
  function status() {
    const subject = view === 'playground' ? `${simulation.snapshot().bodies.length} planets`
      : view === 'solar' ? '8 planets · one home' : view === 'blackhole' ? 'Beyond the light' : 'Our galactic neighborhood';
    summary.textContent = `${subject} · ${paused ? 'paused' : 'in motion'}`;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
  }
  function screen(point) { return { x: width / 2 + point.x * scale, y: height / 2 - point.y * scale }; }
  function world(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left - width / 2) / scale, y: (height / 2 - event.clientY + rect.top) / scale };
  }
  function radiusOf(body) { return Math.max(3, body.radius * scale); }
  function validPosition(point) {
    if (Math.hypot(point.x, point.y) <= WORLD.starRadius) return false;
    return !simulation.snapshot().bodies.some((body) => Math.hypot(point.x - body.x, point.y - body.y) * scale <= radiusOf(body));
  }
  function readColors() {
    const style = getComputedStyle(host);
    for (const name of ['background', 'text', 'star', 'highlight', 'shadow', 'planet', 'secondary', 'guide', 'grid', 'muted', 'ocean', 'rust', 'ice', 'nebula', 'void', 'hot', 'ember', 'radiance']) {
      colors[name] = style.getPropertyValue(`--cosmos-${name}`).trim();
    }
  }
  function circle(x, y, radius, color, fill = true) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) { context.fillStyle = color; context.fill(); }
    else { context.strokeStyle = color; context.stroke(); }
  }

  function draw() {
    if (disposed) return;
    context.setTransform(density, 0, 0, density, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = colors.background;
    context.fillRect(0, 0, width, height);
    if (view !== 'playground') {
      scenery.background(width, height, colors, motion.matches);
      atlas.draw(view, width, height, colors, motion.matches);
      if (view !== 'blackhole') scenery.effects(width, height, colors, motion.matches);
      return;
    }
    context.lineWidth = 1;
    context.strokeStyle = colors.grid;
    context.beginPath();
    for (let x = (width / 2) % 36; x < width; x += 36) { context.moveTo(x, 0); context.lineTo(x, height); }
    for (let y = (height / 2) % 36; y < height; y += 36) { context.moveTo(0, y); context.lineTo(width, y); }
    context.stroke();
    scenery.background(width, height, colors, motion.matches);
    for (const radius of WORLD.seedRadii) circle(width / 2, height / 2, radius * scale, colors.guide, false);

    for (const body of simulation.snapshot().bodies) {
      const color = [colors.planet, colors.secondary, colors.muted][body.tone];
      context.strokeStyle = color;
      context.lineWidth = 1.2;
      for (let i = 1; i < body.trail.length; i++) {
        const before = screen(body.trail[i - 1]);
        const point = screen(body.trail[i]);
        context.globalAlpha = i / body.trail.length * 0.65;
        context.beginPath(); context.moveTo(before.x, before.y); context.lineTo(point.x, point.y); context.stroke();
      }
      context.globalAlpha = 1;
      const point = screen(body);
      scenery.planet(body, point, radiusOf(body), { x: width / 2, y: height / 2 }, colors);
    }
    context.lineWidth = 1;
    scenery.sun(width / 2, height / 2, WORLD.starRadius * scale, colors, motion.matches);
    scenery.effects(width, height, colors, motion.matches);

    if (aim) {
      const origin = screen(aim.position);
      const end = screen({ x: aim.position.x + aim.velocity.x / DRAG_GAIN, y: aim.position.y + aim.velocity.y / DRAG_GAIN });
      const angle = Math.atan2(end.y - origin.y, end.x - origin.x);
      context.strokeStyle = colors.star;
      context.lineWidth = 1.4;
      circle(origin.x, origin.y, 7, colors.star, false);
      context.beginPath();
      context.moveTo(origin.x - 11, origin.y); context.lineTo(origin.x + 11, origin.y);
      context.moveTo(origin.x, origin.y - 11); context.lineTo(origin.x, origin.y + 11);
      context.moveTo(origin.x, origin.y); context.lineTo(end.x, end.y);
      if (Math.hypot(end.x - origin.x, end.y - origin.y) > 4) {
        context.moveTo(end.x - 9 * Math.cos(angle - 0.45), end.y - 9 * Math.sin(angle - 0.45));
        context.lineTo(end.x, end.y);
        context.lineTo(end.x - 9 * Math.cos(angle + 0.45), end.y - 9 * Math.sin(angle + 0.45));
      }
      context.stroke();
    }
  }

  function fail(error) { dispose(); onFatalError(error); }
  function guarded(fn) {
    return (...args) => {
      if (disposed) return;
      try { fn(...args); } catch (error) { fail(error); }
    };
  }
  function listen(target, name, fn) { target.addEventListener(name, guarded(fn), { signal: listeners.signal }); }
  function schedule() {
    if (!disposed && !paused && !document.hidden && frame === null) frame = requestAnimationFrame(tick);
  }
  function stopClock() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; lastTime = null; accumulator = 0;
  }
  function syncMotionPreference() {
    const shouldPause = motion.matches && !reducedMotion;
    reducedMotion = motion.matches;
    if (shouldPause) {
      paused = true; stopClock(); status(); draw(); announce('Paused for reduced motion.');
    }
  }
  const tick = guarded((time) => {
    frame = null;
    // Also check at frame boundaries: emulation can update matches without a change event.
    syncMotionPreference();
    if (paused || document.hidden) { stopClock(); return; }
    const elapsed = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.25);
    if (view === 'playground') accumulator += elapsed * RATE;
    else atlas.advance(view, elapsed * speed);
    scenery.advance(elapsed, motion.matches);
    lastTime = time;
    let steps = 0;
    let removed = false;
    while (accumulator >= WORLD.step && steps < 24) {
      const events = simulation.step();
      if (events.some((event) => event.reason === 'impact')) scenery.impact();
      removed = events.length > 0 || removed;
      accumulator -= WORLD.step;
      steps++;
    }
    if (steps === 24) accumulator = 0;
    if (removed) status();
    draw(); schedule();
  });

  function cancelAim() {
    if (!aim) return false;
    const pointerId = aim.pointerId;
    aim = null;
    if (pointerId !== undefined && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    help.textContent = DEFAULT_HELP;
    announce('Launch cancelled.');
    draw();
    return true;
  }
  function selectPlanet(index) {
    planetSelect.value = String(index);
    atlas.select(index);
    fact.textContent = `${PLANETS[index].name} — ${PLANETS[index].fact}`;
    draw();
  }
  function changeView(next) {
    cancelAim();
    scenery.clearEffects();
    view = next;
    if (dialog) dialog.dataset.view = view;
    readColors();
    stopClock();
    for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === view));
    launchButton.hidden = view !== 'playground';
    speedSelect.parentElement.hidden = view === 'playground';
    solarControl.hidden = view !== 'solar';
    homeButton.hidden = view !== 'galaxy';
    info.hidden = view === 'playground';
    const title = view === 'solar' ? 'Solar System' : view === 'galaxy' ? 'Milky Way' : view === 'blackhole' ? 'Black Hole' : 'Gravity playground';
    canvas.setAttribute('aria-label', title);
    host.querySelector('#cosmos-description').textContent = view === 'solar'
      ? 'Eight planets orbit the Sun. Select a planet with the Explore menu or by tapping it.'
      : view === 'galaxy' ? 'An illustrative spiral galaxy. Use Visit the Solar System to explore our neighborhood.'
      : view === 'blackhole' ? 'A dark black-hole shadow encircled by a bright photon ring. An orange and gold accretion disk appears bent above and below it.'
      : 'A fixed star attracts orbiting planets. Drag to launch, or use Launch planet for keyboard aiming.';
    help.textContent = view === 'solar' ? 'Tap a planet to explore. Sizes, distances, and orbital speeds are compressed for this miniature.'
      : view === 'galaxy' ? 'Tap “You are here” to visit home. An artistic view of the Milky Way; rotation is illustrative.'
      : view === 'blackhole' ? 'Inspired by Interstellar. An artistic impression of gravitational lensing; sizes and motion are illustrative.' : DEFAULT_HELP;
    if (view === 'solar') selectPlanet(Number(planetSelect.value));
    if (view === 'galaxy') fact.textContent = 'One galaxy, hundreds of billions of stars. Our Sun lives roughly 26,000 light-years from the center.';
    if (view === 'blackhole') fact.textContent = 'The horizon itself emits no light. The glow comes from hot matter around it, with gravity bending the far side of the disk into view.';
    status(); draw(); schedule();
  }
  function finishLaunch() {
    if (!aim) return;
    if (!validPosition(aim.position)) {
      announce('Choose an empty spot outside the star and planets.');
      return;
    }
    const result = simulation.launch(aim.position, aim.velocity);
    const keyboard = aim.kind === 'keyboard';
    cancelAim();
    status(); draw();
    announce(result.ok ? (result.replaced === null ? 'Planet launched.' : 'Planet launched. The oldest visitor planet was replaced.') : 'Choose a closer launch position.');
    if (keyboard) launchButton.focus({ preventScroll: true });
  }
  function updatePointer(event) {
    const point = world(event);
    aim.velocity = limitVelocity({ x: (point.x - aim.position.x) * DRAG_GAIN, y: (point.y - aim.position.y) * DRAG_GAIN });
    draw();
  }
  function keyboardHelp() {
    const p = aim.stage === 'position' ? aim.position : aim.velocity;
    help.textContent = aim.stage === 'position'
      ? 'Arrow keys: position · Shift: larger steps · Enter: aim · Escape: cancel'
      : 'Arrows: velocity · Shift: larger steps · 0: drop · Enter: launch · Escape: cancel';
    announce(`${aim.stage === 'position' ? 'Position' : 'Velocity'}: x ${p.x.toFixed(2)}, y ${p.y.toFixed(2)}. ${help.textContent}`);
  }
  function resize() {
    cancelAim();
    scenery.clearEffects();
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    scale = Math.min(width, height) / 3.5;
    density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
    draw();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    stopClock();
    listeners.abort();
    signal.removeEventListener('abort', dispose);
    resizeObserver?.disconnect(); themeObserver?.disconnect();
    if (aim?.pointerId !== undefined && canvas.hasPointerCapture(aim.pointerId)) canvas.releasePointerCapture(aim.pointerId);
    aim = null;
    simulation = null;
    if (dialog) delete dialog.dataset.view;
    host.replaceChildren();
  }

  try {
    signal.addEventListener('abort', dispose, { once: true });
    if (signal.aborted) { dispose(); return { dispose, cancelAim }; }
    for (const button of viewButtons) listen(button, 'click', () => changeView(button.dataset.view));
    listen(planetSelect, 'change', () => selectPlanet(Number(planetSelect.value)));
    listen(homeButton, 'click', () => { changeView('solar'); viewButtons[0].focus({ preventScroll: true }); });
    listen(speedSelect, 'change', () => { speed = Number(speedSelect.value); });
    listen(canvas, 'pointerdown', (event) => {
      if (event.button !== 0 || aim?.kind === 'pointer') return;
      if (view !== 'playground') {
        const rect = canvas.getBoundingClientRect();
        const hit = atlas.hit(event.clientX - rect.left, event.clientY - rect.top);
        if (hit === 'solar') changeView('solar');
        else if (typeof hit === 'number') selectPlanet(hit);
        return;
      }
      const point = world(event);
      if (!validPosition(point)) { announce('Choose an empty spot outside the star and planets.'); return; }
      cancelAim();
      event.preventDefault(); canvas.focus({ preventScroll: true });
      aim = { kind: 'pointer', pointerId: event.pointerId, position: point, velocity: { x: 0, y: 0 } };
      canvas.setPointerCapture(event.pointerId); draw();
    });
    listen(canvas, 'pointermove', (event) => {
      if (event.pointerType === 'mouse' && !motion.matches) {
        const rect = canvas.getBoundingClientRect();
        scenery.pointAt((event.clientX - rect.left) / width * 2 - 1, (event.clientY - rect.top) / height * 2 - 1);
      }
      if (aim?.pointerId === event.pointerId) updatePointer(event);
    });
    listen(canvas, 'pointerleave', () => scenery.pointAt(0, 0));
    listen(canvas, 'pointerup', (event) => {
      if (aim?.pointerId !== event.pointerId) return;
      updatePointer(event); finishLaunch();
      // An occupied spawn point at release cancels this pointer gesture.
      if (aim?.kind === 'pointer') cancelAim();
    });
    for (const name of ['pointercancel', 'lostpointercapture']) {
      listen(canvas, name, (event) => { if (aim?.pointerId === event.pointerId) cancelAim(); });
    }
    listen(launchButton, 'click', () => {
      cancelAim();
      let position = { x: 0.85, y: 0 };
      for (let i = 0; i < 32 && !validPosition(position); i++) {
        const angle = (i + 1) * Math.PI / 16;
        position = { x: Math.cos(angle) * 0.85, y: Math.sin(angle) * 0.85 };
      }
      aim = { kind: 'keyboard', stage: 'position', position, velocity: { x: 0, y: 0 } };
      canvas.focus({ preventScroll: true }); keyboardHelp(); draw();
    });
    listen(canvas, 'keydown', (event) => {
      if (aim?.kind !== 'keyboard' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Tab') { cancelAim(); return; }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.repeat) return;
        if (aim.stage === 'position') {
          if (!validPosition(aim.position)) { announce('Choose an empty spot outside the star and planets.'); return; }
          aim.stage = 'velocity'; aim.velocity = circularVelocity(aim.position); keyboardHelp(); draw();
        } else finishLaunch();
        return;
      }
      if (event.key === '0' && aim.stage === 'velocity') {
        event.preventDefault(); aim.velocity = { x: 0, y: 0 }; keyboardHelp(); draw(); return;
      }
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
      if (!direction) return;
      event.preventDefault();
      const key = aim.stage === 'position' ? 'position' : 'velocity';
      const amount = (key === 'position' ? 0.025 : 0.08) * (event.shiftKey ? 5 : 1);
      aim[key].x += direction[0] * amount; aim[key].y += direction[1] * amount;
      if (key === 'position') {
        aim.position.x = Math.max(-width / (2 * scale), Math.min(width / (2 * scale), aim.position.x));
        aim.position.y = Math.max(-height / (2 * scale), Math.min(height / (2 * scale), aim.position.y));
      } else aim.velocity = limitVelocity(aim.velocity);
      keyboardHelp(); draw();
    });
    listen(canvas, 'blur', () => { if (aim?.kind === 'keyboard') cancelAim(); });
    listen(pauseButton, 'click', () => { paused = !paused; stopClock(); status(); draw(); schedule(); announce(paused ? 'Paused.' : 'Resumed.'); });
    listen(resetButton, 'click', () => {
      cancelAim();
      if (view === 'playground') simulation.reset();
      else { atlas.reset(view); if (view === 'solar') selectPlanet(2); }
      scenery.reset(); stopClock(); status(); draw(); schedule();
      announce(view === 'playground' ? 'Reset to three planets.' : 'View reset.');
    });
    listen(motion, 'change', syncMotionPreference);
    listen(document, 'visibilitychange', () => { stopClock(); schedule(); });
    listen(window, 'resize', resize);
    resizeObserver = new ResizeObserver(guarded(resize));
    resizeObserver.observe(canvas);
    themeObserver = new MutationObserver(guarded(() => { readColors(); draw(); }));
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    readColors(); resize(); changeView('solar');
  } catch (error) { dispose(); throw error; }

  return { dispose, cancelAim };
}
