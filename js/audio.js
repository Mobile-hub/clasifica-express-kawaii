// Soft synthesized sounds (WebAudio): kawaii blips for every event and a gentle looping tune. M toggles mute.
(function (root) {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicOn = false;
  let nextNoteTime = 0;
  let step = 0;

  try {
    muted = localStorage.getItem('clasifica-express:muted') === '1';
  } catch (e) { /* storage unavailable */ }

  // Must be called from a user gesture (browsers block audio until then).
  function unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }

  function tone(freq, start, dur, type, vol, slideTo, dest) {
    if (!ctx) return;
    const t = ctx.currentTime + (start || 0);
    const o = ctx.createOscillator();
    const env = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(env);
    env.connect(dest || master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  const N = (semi) => 523.25 * Math.pow(2, semi / 12); // semitones from C5

  const sfx = {
    click() { tone(N(7), 0, 0.06, 'triangle', 0.18); },
    move() { tone(N(12), 0, 0.04, 'sine', 0.12); },
    good() { tone(N(4), 0, 0.1, 'triangle', 0.25); tone(N(11), 0.07, 0.16, 'triangle', 0.25); },
    pop() { tone(N(0), 0, 0.09, 'sine', 0.35, N(19)); tone(N(16), 0.05, 0.08, 'triangle', 0.15); },
    drop() { tone(N(9), 0, 0.12, 'sine', 0.3, N(-3)); },
    combo() { [0, 4, 7, 12].forEach((s, i) => tone(N(s + 4), i * 0.06, 0.12, 'triangle', 0.22)); },
    bad() { tone(N(-5), 0, 0.22, 'triangle', 0.25, N(-9)); },
    fall() { tone(N(5), 0, 0.4, 'sine', 0.25, N(-14)); },
    clear() { [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => tone(N(s), i * 0.1, 0.18, 'triangle', 0.25)); },
    gameover() { [7, 4, 0, -5].forEach((s, i) => tone(N(s), i * 0.16, 0.25, 'triangle', 0.22)); },
    egg() { [0, 7, 12, 16, 19, 24].forEach((s, i) => tone(N(s), i * 0.05, 0.14, 'sine', 0.22)); },
  };

  function play(name) {
    if (sfx[name]) sfx[name]();
  }

  // Simple scheduler for a C-major pentatonic loop: melody + soft bass.
  const MELODY = [0, 4, 7, 9, 7, 4, 2, -1, 0, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0, -1, 2, 4, 2, -1];
  const BASS = [-24, -24, -17, -17, -20, -20, -15, -15];
  const BEAT = 0.28;

  function schedule() {
    if (!ctx || !musicOn) return;
    while (nextNoteTime < ctx.currentTime + 0.3) {
      const start = nextNoteTime - ctx.currentTime;
      const m = MELODY[step % MELODY.length];
      if (step % 3 !== 2) tone(N(m), start, BEAT * 0.9, 'triangle', 0.5, null, musicGain);
      if (step % 3 === 0) tone(N(BASS[Math.floor(step / 3) % BASS.length]), start, BEAT * 2.6, 'sine', 0.6, null, musicGain);
      nextNoteTime += BEAT;
      step++;
    }
  }

  function startMusic() {
    if (!ctx || musicOn) return;
    musicOn = true;
    nextNoteTime = ctx.currentTime + 0.1;
  }

  function stopMusic() {
    musicOn = false;
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    try {
      localStorage.setItem('clasifica-express:muted', muted ? '1' : '0');
    } catch (e) { /* storage unavailable */ }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function suspend() {
    if (ctx && ctx.state === 'running') ctx.suspend();
  }

  (root.CE = root.CE || {}).audio = { unlock, play, schedule, startMusic, stopMusic, toggleMute, isMuted, suspend };
})(window);
