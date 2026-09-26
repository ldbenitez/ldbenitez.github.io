// Dimensionless, star-centered physics. No browser or rendering dependencies.
export const WORLD = Object.freeze({
  mu: 1, starRadius: 0.1, step: 1 / 240, maxSpeed: 4,
  maxBodies: 24, trailLimit: 180, trailInterval: 1 / 60,
  seedRadii: Object.freeze([0.55, 0.95, 1.4]), escapeRadius: 1.4 * 8,
});

const finiteVector = (v) => v && Number.isFinite(v.x) && Number.isFinite(v.y);

export function limitVelocity(velocity) {
  const speed = Math.hypot(velocity.x, velocity.y);
  const factor = speed > WORLD.maxSpeed ? WORLD.maxSpeed / speed : 1;
  return { x: velocity.x * factor, y: velocity.y * factor };
}

export function circularVelocity(position) {
  const radius = Math.hypot(position.x, position.y);
  const speed = Math.sqrt(WORLD.mu / radius);
  return limitVelocity({ x: -position.y / radius * speed, y: position.x / radius * speed });
}

function intersectsStar(x, y, nextX, nextY) {
  const dx = nextX - x;
  const dy = nextY - y;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, -(x * dx + y * dy) / length2));
  return Math.hypot(x + t * dx, y + t * dy) <= WORLD.starRadius;
}

function acceleration(x, y) {
  const radius = Math.hypot(x, y);
  const factor = -WORLD.mu / (radius * radius * radius);
  return { x: x * factor, y: y * factor };
}

export function createSimulation() {
  let bodies = [];
  let nextId = 0;

  function makeBody(position, velocity, seed = false, index = 0) {
    return {
      id: nextId++, x: position.x, y: position.y, vx: velocity.x, vy: velocity.y,
      seed, radius: seed ? [0.026, 0.042, 0.031][index] : 0.028,
      tone: seed ? index : 0, trail: [], trailTime: 0,
    };
  }

  function reset() {
    nextId = 0;
    bodies = WORLD.seedRadii.map((radius, index) => {
      const angle = [0.2, 2.7, 1.1][index];
      const position = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      return makeBody(position, circularVelocity(position), true, index);
    });
  }

  function launch(position, velocity) {
    if (!finiteVector(position) || !finiteVector(velocity)
      || !Number.isFinite(Math.hypot(velocity.x, velocity.y))) return { ok: false };
    const radius = Math.hypot(position.x, position.y);
    if (radius <= WORLD.starRadius || radius > WORLD.escapeRadius) return { ok: false };
    let replaced = null;
    if (bodies.length >= WORLD.maxBodies) {
      const oldest = bodies.findIndex((body) => !body.seed);
      if (oldest < 0) return { ok: false };
      [replaced] = bodies.splice(oldest, 1);
    }
    const body = makeBody(position, limitVelocity(velocity));
    bodies.push(body);
    return { ok: true, id: body.id, replaced: replaced?.id ?? null };
  }

  function step(dt = WORLD.step) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.1) throw new RangeError('Invalid physics step');
    const removed = [];
    bodies = bodies.filter((body) => {
      const { x, y, vx, vy } = body;
      let reason;
      if (![x, y, vx, vy].every(Number.isFinite)) reason = 'invalid';
      else if (Math.hypot(x, y) <= WORLD.starRadius) reason = 'impact';
      else if (Math.hypot(x, y) > WORLD.escapeRadius) reason = 'escape';
      if (reason) { removed.push({ id: body.id, reason }); return false; }

      const a = acceleration(x, y);
      const nx = x + vx * dt + 0.5 * a.x * dt * dt;
      const ny = y + vy * dt + 0.5 * a.y * dt * dt;
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) reason = 'invalid';
      else if (intersectsStar(x, y, nx, ny)) reason = 'impact';
      else if (Math.hypot(nx, ny) > WORLD.escapeRadius) reason = 'escape';
      if (reason) { removed.push({ id: body.id, reason }); return false; }

      const nextA = acceleration(nx, ny);
      body.vx += 0.5 * (a.x + nextA.x) * dt;
      body.vy += 0.5 * (a.y + nextA.y) * dt;
      if (!Number.isFinite(body.vx) || !Number.isFinite(body.vy)) {
        removed.push({ id: body.id, reason: 'invalid' }); return false;
      }
      body.x = nx;
      body.y = ny;
      body.trailTime += dt;
      if (body.trailTime + 1e-12 >= WORLD.trailInterval) {
        body.trailTime %= WORLD.trailInterval;
        body.trail.push(Object.freeze({ x: nx, y: ny }));
        if (body.trail.length > WORLD.trailLimit) body.trail.shift();
      }
      return true;
    });
    return removed;
  }

  // Copies protect state; frozen trail samples can safely be shared.
  function snapshot() {
    return { world: WORLD, bodies: bodies.map(({ trailTime, ...body }) => ({ ...body, trail: body.trail.slice() })) };
  }

  reset();
  return { step, launch, reset, snapshot };
}
