import test from 'node:test';
import assert from 'node:assert/strict';
import { createAmbience } from '../static/js/cosmos-audio.js';

test('ambience loads only on request, loops, pauses, and releases on close', async () => {
  class FakeAudio {
    static instances = [];
    constructor(src) {
      this.src = src;
      this.playCount = 0;
      this.pauseCount = 0;
      FakeAudio.instances.push(this);
    }
    async play() { this.playCount++; }
    pause() { this.pauseCount++; }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() { this.unloaded = true; }
  }

  const ambience = createAmbience(FakeAudio);
  assert.equal(FakeAudio.instances.length, 0);
  await ambience.start();
  const audio = FakeAudio.instances[0];
  assert.equal(audio.src, '/audio/stillness.mp3');
  assert.equal(audio.loop, true);
  assert.equal(audio.volume, 0.35);
  assert.equal(audio.playCount, 1);
  ambience.stop();
  assert.equal(audio.pauseCount, 1);
  await ambience.start();
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(audio.playCount, 2);
  ambience.dispose();
  assert.equal(audio.pauseCount, 2);
  assert.equal(audio.src, '');
  assert.equal(audio.unloaded, true);
});
