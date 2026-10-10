// Pure gameplay logic: seeded random, per-level word queue with retries, answer checking, hint texts, combo.
// Works in the browser (window.CE.deck) and in node (module.exports) for tests.
(function (root) {
  const inNode = typeof module !== 'undefined' && module.exports;
  const S = inNode ? require('./syllables.js') : root.CE.syllables;
  const W = inNode ? require('./words.js') : root.CE.words;

  const SORT_CLASSES = ['aguda', 'llana', 'esdrujula'];
  const RETRY_GAP = [3, 5]; // a missed word comes back after 3 to 5 other words

  // mulberry32: small deterministic generator so ?seed=N replays the same game.
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickWeighted(weights, rng) {
    const keys = Object.keys(weights);
    let r = rng() * keys.reduce((s, k) => s + weights[k], 0);
    for (const k of keys) {
      r -= weights[k];
      if (r < 0) return k;
    }
    return keys[keys.length - 1];
  }

  function usableIn(mode, w) {
    return mode !== 'tilde' || !w.ambiguous;
  }

  // What the player must answer for a word in a mode.
  function makeTask(word, mode) {
    const task = { word, mode, egg: !!word.egg };
    if (mode === 'pop') {
      task.options = word.syllables.slice();
      task.answer = word.stress;
    } else if (mode === 'sort') {
      task.answer = word.cls;
    } else {
      task.shown = S.stripTildes(word.word);
      task.slots = S.tildeSlots(word.word);
      task.answer = S.tildePosition(word.word); // -1 = no tilde
    }
    return task;
  }

  function isCorrect(task, given) {
    return given === task.answer;
  }

  // Word queue for one level. Balanced by class (and by tilde / no tilde in the Tildes mode), no repeats except
  // retries of missed words, which come back a few words later and must be solved before the level is cleared.
  class Deck {
    constructor(level, rng, bank) {
      this.level = level;
      this.rng = rng;
      this.bank = bank || W.ALL;
      this.used = new Set();
      this.retries = []; // { word, mode, due }
      this.served = 0;
      this.correct = 0;
      this.turn = 0;
      this.retryOut = null; // retry served but not answered yet
    }

    drawWord(mode) {
      const tier = Number(pickWeighted(this.level.tiers, this.rng));
      let want;
      if (mode === 'tilde') {
        const withTilde = this.rng() < 0.5;
        want = (w) => S.hasTilde(w.word) === withTilde;
      } else {
        const cls = SORT_CLASSES[this.turn % SORT_CLASSES.length];
        want = (w) => w.cls === cls;
      }
      const base = (w) => w.tier === tier && usableIn(mode, w) && !this.used.has(w.word);
      let pool = this.bank.filter((w) => base(w) && want(w));
      if (pool.length === 0) pool = this.bank.filter((w) => !this.used.has(w.word) && want(w));
      if (pool.length === 0) pool = this.bank.filter((w) => !this.used.has(w.word));
      if (pool.length === 0) {
        this.used.clear();
        pool = this.bank.slice();
      }
      return pool[Math.floor(this.rng() * pool.length)];
    }

    next() {
      this.turn++;
      const dueIdx = this.retries.findIndex((r) => r.due <= this.served);
      let task;
      if (dueIdx >= 0) {
        const r = this.retries.splice(dueIdx, 1)[0];
        task = makeTask(r.word, r.mode);
        task.retry = true;
        this.retryOut = task;
      } else if (this.level.eggChance && this.rng() < this.level.eggChance) {
        task = makeTask(W.EGGS[Math.floor(this.rng() * W.EGGS.length)], 'sort');
      } else {
        // Express decides the mode first so the Tildes share of words can be balanced too.
        let mode = this.level.mode === 'express' ? ['pop', 'sort', 'tilde'][Math.floor(this.rng() * 3)] : this.level.mode;
        const word = this.drawWord(mode);
        if (mode === 'tilde' && word.ambiguous) mode = 'sort';
        this.used.add(word.word);
        task = makeTask(word, mode);
      }
      this.served++;
      return task;
    }

    // Record the outcome of a task. Missed words (except easter eggs) are scheduled again.
    answer(task, ok) {
      if (task === this.retryOut) this.retryOut = null;
      if (ok) {
        if (!task.egg) this.correct++;
        return;
      }
      if (task.egg) return;
      const gap = RETRY_GAP[0] + Math.floor(this.rng() * (RETRY_GAP[1] - RETRY_GAP[0] + 1));
      this.retries.push({ word: task.word, mode: task.mode, due: this.served + gap });
    }

    get done() {
      return this.correct >= this.level.goal && this.retries.length === 0 && !this.retryOut;
    }

    get progress() {
      return Math.min(1, this.correct / this.level.goal);
    }
  }

  // Streak → score multiplier (×1 … ×5) and belt speed factor.
  class Combo {
    constructor(maxSpeed) {
      this.maxSpeed = maxSpeed || 1.4;
      this.streak = 0;
      this.best = 0;
      this.score = 0;
      this.speed = 1;
    }

    get multiplier() {
      return Math.min(5, 1 + Math.floor(this.streak / 5));
    }

    hit(bonus) {
      this.streak++;
      this.best = Math.max(this.best, this.streak);
      const points = (bonus || 100) * this.multiplier;
      this.score += points;
      this.speed = Math.min(this.maxSpeed, this.speed + 0.03);
      return points;
    }

    miss() {
      this.streak = 0;
      this.speed = Math.max(1, this.speed - 0.1);
    }
  }

  const ORDINAL = ['última', 'penúltima', 'antepenúltima', 'anterior a la antepenúltima'];
  const CLASS_TEXT = { aguda: 'AGUDA', llana: 'LLANA', esdrujula: 'ESDRÚJULA', sobresdrujula: 'SOBRESDRÚJULA' };

  function endingText(word) {
    const plain = S.stripTildes(word);
    const last = plain[plain.length - 1];
    if ('aeiou'.includes(last)) return 'acaba en vocal';
    if ((last === 'n' || last === 's') && S.endsInVowelNS(word)) return `acaba en -${last}`;
    if (last === 's') return `acaba en -${plain.slice(-2)}`;
    return `acaba en -${last}`;
  }

  // Short Spanish explanation shown after a miss: why the word is what it is. Never shown before answering.
  function explain(word) {
    const fromEnd = Math.min(3, word.syllables.length - 1 - word.stress);
    const lines = [`La sílaba tónica es la ${ORDINAL[fromEnd]}: es ${CLASS_TEXT[word.cls]}.`];
    const tilde = S.hasTilde(word.word);
    const ending = endingText(word.word);
    if (S.hasHiatusTilde(word.word)) {
      lines.push('La í o la ú tónica junto a a, e, o se separa (hiato) y siempre lleva tilde.');
    } else if (word.cls === 'aguda') {
      lines.push('Las agudas llevan tilde si acaban en vocal, -n o -s.');
      lines.push(`«${word.word}» ${ending}: ${tilde ? 'lleva tilde' : 'no lleva tilde'}.`);
    } else if (word.cls === 'llana') {
      lines.push('Las llanas llevan tilde si NO acaban en vocal, -n o -s.');
      lines.push(`«${word.word}» ${ending}: ${tilde ? 'lleva tilde' : 'no lleva tilde'}.`);
    } else {
      lines.push(`Las ${word.cls === 'esdrujula' ? 'esdrújulas' : 'sobresdrújulas'} siempre llevan tilde.`);
    }
    return { syllables: word.syllables, stress: word.stress, cls: word.cls, word: word.word, lines };
  }

  const api = { SORT_CLASSES, makeRng, shuffle, makeTask, isCorrect, Deck, Combo, explain, endingText };
  if (inNode) module.exports = api;
  else (root.CE = root.CE || {}).deck = api;
})(typeof window !== 'undefined' ? window : globalThis);
