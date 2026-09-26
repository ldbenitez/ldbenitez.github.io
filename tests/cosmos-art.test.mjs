import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenery, segmentCircleHit } from '../static/js/cosmos-art.js';
import { drawBlackHole } from '../static/js/cosmos-black-hole.js';

test('comet contact detects crossings, tangency, misses, and starting inside', () => {
  assert.equal(segmentCircleHit({ x: -10, y: 0 }, { x: 10, y: 0 }, 2), 0.4);
  assert.equal(segmentCircleHit({ x: -10, y: 2 }, { x: 10, y: 2 }, 2), 0.5);
  assert.equal(segmentCircleHit({ x: -10, y: 3 }, { x: 10, y: 3 }, 2), null);
  assert.equal(segmentCircleHit({ x: 0, y: 0 }, { x: 10, y: 0 }, 2), 0);
  assert.equal(segmentCircleHit({ x: 5, y: 0 }, { x: 5, y: 0 }, 2), null);
  assert.equal(segmentCircleHit({ x: 5, y: 0 }, { x: 10, y: 0 }, 2), null);
});

function recorder() {
  const calls = [];
  const gradient = { addColorStop() {} };
  const context = new Proxy({}, {
    get(_, key) {
      return (...args) => {
        calls.push([key, ...args]);
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return gradient;
      };
    },
    set() { return true; },
  });
  return { context, calls };
}
const colors = { background: '#111', muted: '#888', star: '#da5', highlight: '#fff',
  planet: '#b99', shadow: '#222', void: '#000', hot: '#fc8', ember: '#e73', nebula: '#869', radiance: '#fff' };

test('a comet is consumed on impact; sparks pause, expire, reset, and respect reduced motion', () => {
  const { context, calls } = recorder();
  const scene = createScenery(context);
  scene.advance(3, false);
  scene.background(800, 600, colors, false);
  scene.effects(800, 600, colors, false);
  const [, , , x, y] = calls.find(([name]) => name === 'createLinearGradient');
  scene.background(800, 600, colors, false);
  scene.planet({ id: 1, tone: 0 }, { x, y }, 12, { x: 400, y: 300 }, colors);
  calls.length = 0;
  scene.effects(800, 600, colors, false);
  assert.ok(!calls.some(([name]) => name === 'createLinearGradient'), 'comet disappears');
  assert.ok(calls.filter(([name]) => name === 'arc').length >= 13, 'shockwave and sparks');
  const paused = [...calls];
  calls.length = 0;
  scene.effects(800, 600, colors, false);
  assert.deepEqual(calls, paused, 'no advancement while paused');
  calls.length = 0;
  scene.effects(800, 600, colors, true);
  assert.equal(calls.length, 0, 'reduced motion suppresses effects');
  scene.advance(1.3, false);
  calls.length = 0;
  scene.effects(800, 600, colors, false);
  assert.ok(!calls.some(([name]) => name === 'arc'), 'burst expires');
  scene.reset();
  calls.length = 0;
  scene.effects(800, 600, colors, false);
  assert.ok(!calls.some(([name]) => name === 'arc'), 'reset clears effects');
});

test('black-hole rendering has finite geometry at mobile and desktop sizes', () => {
  for (const [width, height] of [[320, 180], [1440, 800]]) {
    const { context, calls } = recorder();
    drawBlackHole(context, width, height, colors, 123);
    for (const [name, ...args] of calls) {
      if (['ellipse', 'arc', 'createRadialGradient', 'createLinearGradient'].includes(name)) {
        assert.ok(args.every(Number.isFinite), name);
      }
    }
    assert.ok(calls.some(([name]) => name === 'ellipse'));
  }
});

test('black-hole bright material visibly travels while a paused frame stays identical', () => {
  function frame(time) {
    const { context, calls } = recorder();
    drawBlackHole(context, 1440, 800, colors, time);
    return calls.filter(([name, , , radius]) => name === 'arc' && radius < 20);
  }
  const initial = frame(0);
  const moving = frame(2);
  assert.equal(initial.length, 16);
  assert.deepEqual(initial, frame(0), 'same clock means same frame');
  assert.ok(initial.every((point, i) => Math.hypot(point[1] - moving[i][1], point[2] - moving[i][2]) > 20),
    'every bright knot travels a clearly visible distance in two seconds');
});
