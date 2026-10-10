// Boot: build the SVG layers, wait for the fonts, read debug params and run the main loop.
(function (root) {
  const CE = root.CE;
  const { el, clear } = CE.svg;

  function params() {
    const q = new URLSearchParams(location.search);
    const out = {};
    if (q.has('level')) out.level = Math.max(1, Math.min(20, Number(q.get('level')) || 1));
    if (['pop', 'sort', 'tilde', 'express'].includes(q.get('mode'))) out.mode = q.get('mode');
    if (q.has('seed')) out.seed = Number(q.get('seed')) || 0;
    if (q.has('auto')) out.auto = q.get('auto') === 'miss' ? 'miss' : true;
    if (q.has('screen')) out.screen = q.get('screen');
    if (q.has('egg')) out.egg = true;
    if (q.has('all')) out.all = true;
    if (q.has('sim')) out.sim = Number(q.get('sim')) || 0;
    return out;
  }

  window.addEventListener('error', (e) => {
    document.body.dataset.error = `${e.message} @ ${e.filename}:${e.lineno}`;
  });

  function boot() {
    const stage = document.getElementById('stage');
    clear(stage);
    const world = el('g', { id: 'world' });
    const layers = { world };
    for (const name of ['bg', 'scene', 'fixed', 'carriers', 'fx']) {
      layers[name] = el('g', { id: name });
      world.appendChild(layers[name]);
    }
    stage.appendChild(world);
    for (const name of ['hud', 'overlay']) {
      layers[name] = el('g', { id: name });
      stage.appendChild(layers[name]);
    }

    const debug = params();
    CE.input.init(stage, () => {
      CE.audio.unlock();
      CE.audio.startMusic();
    });
    CE.game.init(layers, debug);
    CE.game.menuSel = debug.level ? debug.level - 1 : CE.game.firstOpenLevel();
    CE.game.showMenu();
    if (debug.screen) CE.game.debugScreen(debug.screen);
    else if (debug.level || debug.auto) CE.game.startLevel(CE.game.menuSel);

    // ?sim=N: simulate N seconds of play in fixed steps (headless browsers do not run animation frames).
    if (debug.sim) {
      let steps = Math.round(debug.sim * 30);
      const chunk = () => {
        try {
          for (let i = 0; i < 300 && steps > 0; i++, steps--) {
            CE.input.flush();
            CE.game.update(1 / 30);
          }
        } catch (e) {
          document.body.dataset.error = e.stack;
          steps = 0;
        }
        if (steps > 0) setTimeout(chunk, 0);
        else document.body.dataset.simDone = '1';
      };
      setTimeout(chunk, 0);
      return;
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      CE.input.flush();
      CE.game.update(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        CE.game.pause();
        CE.audio.suspend();
      }
    });
  }

  // Text is measured to lay out words, so wait for the bundled fonts (with a timeout fallback).
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('800 60px Nunito'), document.fonts.load('700 60px Fredoka')])
    : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(boot, boot);
})(window);
