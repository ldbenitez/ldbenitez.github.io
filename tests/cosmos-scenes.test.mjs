import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANETS, orbit, galaxyStars } from '../static/js/cosmos-scenes.js';

test('all eight planets stay on ordered, bounded orbits at every speed', () => {
  assert.equal(PLANETS.length, 8);
  for (const time of [0, 1, 120, 12000]) {
    let previous = 0;
    for (let i = 0; i < PLANETS.length; i++) {
      const p = orbit(i, time);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      assert.ok(p.radius > previous && p.radius <= 1);
      assert.ok(Math.abs(Math.hypot(p.x, p.y) - p.radius) < 1e-12);
      previous = p.radius;
    }
  }
  assert.ok(orbit(0, 1).angle - orbit(0, 0).angle > orbit(7, 1).angle - orbit(7, 0).angle);
});

test('galaxy stars are deterministic, bounded, and finite', () => {
  const stars = galaxyStars();
  assert.equal(stars.length, 2800);
  assert.deepEqual(stars, galaxyStars());
  assert.ok(stars.every((s) => Number.isFinite(s.x) && Number.isFinite(s.y)
    && Math.hypot(s.x, s.y) <= 1 && s.size > 0 && s.alpha > 0 && s.alpha <= 1));
});
