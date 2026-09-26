import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, WORLD, circularVelocity } from '../static/js/cosmos-physics.js';

function advance(sim, seconds) {
  const removed = [];
  for (let i = 0; i < Math.ceil(seconds / WORLD.step); i++) removed.push(...sim.step());
  return removed;
}

for (const [index, radius] of WORLD.seedRadii.entries()) {
  test(`circular orbit at r=${radius} conserves radius and energy for ten periods`, () => {
    const sim = createSimulation();
    const period = 2 * Math.PI * Math.sqrt(radius ** 3 / WORLD.mu);
    const initialEnergy = -WORLD.mu / (2 * radius);
    let maxRadiusDrift = 0;
    let maxEnergyDrift = 0;
    for (let i = 0; i < Math.ceil(10 * period / WORLD.step); i++) {
      sim.step();
      const body = sim.snapshot().bodies[index];
      assert.ok(body?.seed);
      const r = Math.hypot(body.x, body.y);
      const energy = (body.vx ** 2 + body.vy ** 2) / 2 - WORLD.mu / r;
      maxRadiusDrift = Math.max(maxRadiusDrift, Math.abs(r / radius - 1));
      maxEnergyDrift = Math.max(maxEnergyDrift, Math.abs((energy - initialEnergy) / initialEnergy));
    }
    assert.ok(maxRadiusDrift < 0.01, `radius drift ${maxRadiusDrift}`);
    assert.ok(maxEnergyDrift < 0.01, `energy drift ${maxEnergyDrift}`);
  });
}

test('stationary launch falls into the star', () => {
  const sim = createSimulation();
  const { id } = sim.launch({ x: 0.5, y: 0 }, { x: 0, y: 0 });
  assert.ok(advance(sim, 2).some((body) => body.id === id && body.reason === 'impact'));
});

test('a step crossing the entire star is removed before evaluating the next force', () => {
  const sim = createSimulation();
  const { id } = sim.launch({ x: 0.15, y: 0 }, { x: -4, y: 0 });
  assert.ok(sim.step(0.1).some((body) => body.id === id && body.reason === 'impact'));
  assert.equal(sim.snapshot().bodies.length, 3);
});

test('escaping bodies are removed; bound bodies outside the initial view survive', () => {
  const sim = createSimulation();
  const escape = sim.launch({ x: 1, y: 0 }, { x: 4, y: 0 });
  const bound = sim.launch({ x: 3, y: 0 }, circularVelocity({ x: 3, y: 0 }));
  assert.ok(advance(sim, 5).some((body) => body.id === escape.id && body.reason === 'escape'));
  assert.ok(sim.snapshot().bodies.some((body) => body.id === bound.id));
});

test('capacity replaces the oldest visitor planet and retains seeds', () => {
  const sim = createSimulation();
  const ids = [];
  for (let i = 0; i < WORLD.maxBodies - 3; i++) ids.push(sim.launch({ x: 1, y: 0 }, { x: 0, y: 1 }).id);
  const next = sim.launch({ x: 1, y: 0 }, { x: 0, y: 1 });
  assert.equal(next.replaced, ids[0]);
  assert.equal(sim.snapshot().bodies.length, WORLD.maxBodies);
  assert.equal(sim.snapshot().bodies.filter((body) => body.seed).length, 3);
  assert.equal(sim.launch({ x: 1, y: 0 }, { x: 0, y: 1 }).replaced, ids[1]);
});

test('trails are bounded, reset is deterministic, and snapshots cannot mutate state', () => {
  const sim = createSimulation();
  const initial = sim.snapshot();
  advance(sim, 5);
  assert.ok(sim.snapshot().bodies.every((body) => body.trail.length === WORLD.trailLimit));
  const copy = sim.snapshot();
  copy.bodies[0].x = 99;
  copy.bodies[0].trail.length = 0;
  assert.notEqual(sim.snapshot().bodies[0].x, 99);
  assert.equal(sim.snapshot().bodies[0].trail.length, WORLD.trailLimit);
  sim.reset();
  assert.deepEqual(sim.snapshot(), initial);
});

test('invalid inputs are rejected and speed is bounded', () => {
  const sim = createSimulation();
  for (const point of [{ x: NaN, y: 0 }, { x: 0, y: 0 }, { x: Infinity, y: 0 }, { x: 12, y: 0 }]) {
    assert.equal(sim.launch(point, { x: 0, y: 1 }).ok, false);
  }
  assert.equal(sim.launch({ x: 1, y: 0 }, { x: NaN, y: 1 }).ok, false);
  const { id } = sim.launch({ x: 1, y: 0 }, { x: 30, y: 40 });
  const body = sim.snapshot().bodies.find((body) => body.id === id);
  assert.equal(Math.hypot(body.vx, body.vy), WORLD.maxSpeed);
  assert.throws(() => sim.step(NaN), RangeError);
});

test('another planet does not affect an existing trajectory', () => {
  const a = createSimulation();
  const b = createSimulation();
  b.launch({ x: 0.7, y: 0.1 }, { x: 0.1, y: 1 });
  advance(a, 2);
  advance(b, 2);
  assert.deepEqual(a.snapshot().bodies, b.snapshot().bodies.filter((body) => body.seed));
});
