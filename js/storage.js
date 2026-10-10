// Progress record kept only on this device, in localStorage (never cookies, nothing leaves the browser):
//   { v: 1, best: <best run score>, levels: { "<n>": { cleared: true, stars: 0–3, best: <best level score> } } }
// Every access is wrapped in try/catch: without storage the game still works, progress just lasts one session.
// Works in the browser (window.CE.storage) and in node (module.exports) for tests, with any localStorage-like store.
(function (root) {
  const L = typeof module !== 'undefined' && module.exports ? require('./levels.js') : root.CE.levels;

  const KEY = 'clasifica-express:progress';

  function empty() {
    return { v: 1, best: 0, levels: {} };
  }

  function defaultStore() {
    try {
      return root.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  function load(store) {
    store = store === undefined ? defaultStore() : store;
    try {
      const p = JSON.parse((store && store.getItem(KEY)) || 'null');
      if (!p || p.v !== 1 || typeof p.levels !== 'object') return empty();
      return { v: 1, best: Number(p.best) || 0, levels: p.levels };
    } catch (e) {
      return empty();
    }
  }

  function save(p, store) {
    store = store === undefined ? defaultStore() : store;
    try {
      if (store) store.setItem(KEY, JSON.stringify(p));
    } catch (e) { /* storage full or blocked: keep playing */ }
  }

  function cleared(p) {
    return new Set(Object.keys(p.levels).filter((n) => p.levels[n].cleared).map(Number));
  }

  function isUnlocked(p, n) {
    return L.isUnlocked(n, cleared(p));
  }

  function levelInfo(p, n) {
    return p.levels[n] || { cleared: false, stars: 0, best: 0 };
  }

  // Record a cleared level; returns the level numbers this clear has just unlocked.
  function recordClear(p, n, stars, levelScore, runScore) {
    const before = cleared(p);
    const old = levelInfo(p, n);
    p.levels[n] = { cleared: true, stars: Math.max(old.stars, stars), best: Math.max(old.best, levelScore) };
    p.best = Math.max(p.best, runScore || 0);
    const after = cleared(p);
    return L.LEVELS.map((l) => l.n).filter((m) => !L.isUnlocked(m, before) && L.isUnlocked(m, after));
  }

  function recordScore(p, runScore) {
    p.best = Math.max(p.best, runScore || 0);
  }

  // Where "Siguiente" should go: the next level if open, else the first open level not cleared yet, else null (menu).
  function nextLevel(p, n) {
    const done = cleared(p);
    if (n < 20 && L.isUnlocked(n + 1, done)) return n + 1;
    const open = L.LEVELS.find((l) => L.isUnlocked(l.n, done) && !done.has(l.n));
    return open ? open.n : null;
  }

  const api = { KEY, empty, load, save, cleared, isUnlocked, levelInfo, recordClear, recordScore, nextLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.CE = root.CE || {}).storage = api;
})(typeof window !== 'undefined' ? window : globalThis);
