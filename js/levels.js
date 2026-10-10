// The 20 levels: 5 worlds × 4 modes, each world built on a word tier (see words.tierOf).
// Works in the browser (window.CE.levels) and in node (module.exports) for tests.
(function (root) {
  const MODES = ['pop', 'sort', 'tilde', 'express'];

  const MODE_INFO = {
    pop: { title: '¡Pop!', task: 'Explota la sílaba tónica' },
    sort: { title: 'Clasifica', task: '¿Aguda, llana o esdrújula?' },
    tilde: { title: 'Tildes', task: 'Pon la tilde… ¡o no!' },
    express: { title: 'Express', task: '¡De todo un poco!' },
  };

  const WORLDS = [
    { name: 'Pastelería', theme: 'cake' },
    { name: 'Jardín', theme: 'garden' },
    { name: 'Playa', theme: 'beach' },
    { name: 'Ciudad', theme: 'city' },
    { name: 'Espacio', theme: 'space' },
  ];

  // Share of words per tier in each world: mostly the world's own tier plus a review of earlier ones.
  const TIER_MIX = [
    { 1: 1 },
    { 2: 0.7, 1: 0.3 },
    { 3: 0.7, 2: 0.15, 1: 0.15 },
    { 4: 0.7, 3: 0.1, 2: 0.1, 1: 0.1 },
    { 5: 0.5, 4: 0.2, 3: 0.1, 2: 0.1, 1: 0.1 },
  ];
  const FINAL_MIX = { 1: 0.2, 2: 0.2, 3: 0.2, 4: 0.2, 5: 0.2 };

  function build() {
    const out = [];
    for (let w = 0; w < WORLDS.length; w++) {
      for (let m = 0; m < MODES.length; m++) {
        const n = out.length + 1;
        out.push({
          n,
          world: w + 1,
          worldName: WORLDS[w].name,
          theme: WORLDS[w].theme,
          mode: MODES[m],
          tiers: n === 20 ? FINAL_MIX : TIER_MIX[w],
          goal: 10 + n, // correct answers needed to clear the level (11 … 30)
          travel: 14 - (n - 1) * 0.35, // seconds a word needs to cross the belt at base speed (14 … 7.35)
          maxSpeed: 1.3 + w * 0.1, // cap of the speed-up from streaks
          eggChance: w >= 2 ? 0.04 : 0, // sobresdrújula easter egg from world 3 on
        });
      }
    }
    return out;
  }

  const LEVELS = build();

  const api = { MODES, MODE_INFO, WORLDS, LEVELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.CE = root.CE || {}).levels = api;
})(typeof window !== 'undefined' ? window : globalThis);
