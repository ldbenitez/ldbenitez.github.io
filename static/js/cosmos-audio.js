const AUDIO_URL = '/audio/stillness.mp3';

export function createAmbience(AudioClass = globalThis.Audio) {
  let audio = null;

  async function start() {
    if (!AudioClass) throw new Error('Audio playback is unavailable');
    if (!audio) {
      audio = new AudioClass(AUDIO_URL);
      audio.loop = true;
      audio.volume = 0.35;
    }
    await audio.play();
  }

  function stop() {
    audio?.pause();
  }

  function dispose() {
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio = null;
  }

  return { start, stop, dispose, supported: Boolean(AudioClass) };
}
