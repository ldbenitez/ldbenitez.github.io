import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANETS, createAtlas, orbit, galaxyStars } from '../static/js/cosmos-scenes.js';
import { PLANET_FACTS, SOLAR_FEATURES, pickFactIndex } from '../static/js/cosmos-facts.js';

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

test('the Sun and both belts can be explored from the solar canvas', () => {
  const context = new Proxy({ measureText: () => ({ width: 80 }) }, {
    get(target, property) { return property in target ? target[property] : () => {}; },
    set(target, property, value) { target[property] = value; return true; },
  });
  const atlas = createAtlas(context, { sun() {}, planet() {} });
  const width = 800, height = 600;
  atlas.draw('solar', width, height, {
    guide: '#888', rust: '#a55', secondary: '#588', muted: '#888',
    background: '#fff', text: '#111', star: '#a55', highlight: '#fff', shadow: '#333',
    ocean: '#358', ice: '#588', planet: '#854',
  }, true);
  const extent = Math.min((width / 2 - 26) / 1.12, (height / 2 - 36) / (0.64 * 1.12));
  assert.equal(atlas.hit(width / 2, height / 2), 'sun');
  assert.equal(atlas.hit(width / 2 + 0.575 * extent, height / 2), 'asteroid');
  assert.equal(atlas.hit(width / 2 + 1.07 * extent, height / 2), 'kuiper');
  assert.ok(SOLAR_FEATURES.system && SOLAR_FEATURES.sun && SOLAR_FEATURES.asteroid && SOLAR_FEATURES.kuiper);
});

test('each solar destination has five distinct conversational facts', () => {
  assert.equal(PLANET_FACTS.length, PLANETS.length);
  for (const [index, facts] of PLANET_FACTS.entries()) {
    assert.ok(facts.length >= 5);
    assert.equal(new Set(facts).size, facts.length);
    assert.ok(facts.every((fact) => !fact.includes('—') && !fact.includes(PLANETS[index].name)));
  }
  for (const feature of Object.values(SOLAR_FEATURES)) {
    assert.ok(feature.facts.length >= 5);
    assert.equal(new Set(feature.facts).size, feature.facts.length);
    assert.ok(feature.facts.every((fact) => !fact.includes('—') && !fact.includes(feature.name)));
  }
});

test('reselecting a destination can show a different fact', () => {
  assert.equal(pickFactIndex(5, -1, () => 0), 0);
  for (let previous = 0; previous < 5; previous++) {
    for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
      const next = pickFactIndex(5, previous, () => random);
      assert.ok(next >= 0 && next < 5 && next !== previous);
    }
  }
});
