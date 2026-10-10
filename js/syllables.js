// Pure Spanish orthography logic: syllabification, stressed syllable, word class and tilde rules (RAE general rules).
// Works in the browser (window.CE.syllables) and in node (module.exports) for tests.
(function (root) {
  const PLAIN = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
  const VOWELS = 'aeiouáéíóúü';
  const STRONG = 'aeoáéó';
  const STRESSED_WEAK = 'íú';
  const CLUSTERS = ['pr', 'pl', 'br', 'bl', 'fr', 'fl', 'tr', 'dr', 'cr', 'cl', 'gr', 'gl', 'kr', 'kl'];

  const CLASSES = ['aguda', 'llana', 'esdrujula', 'sobresdrujula'];
  const CLASS_LABELS = { aguda: 'AGUDA', llana: 'LLANA', esdrujula: 'ESDRÚJULA', sobresdrujula: 'SOBRESDRÚJULA' };

  function stripTildes(word) {
    return word.replace(/[áéíóú]/g, (c) => PLAIN[c]);
  }

  function hasTilde(word) {
    return /[áéíóú]/.test(word);
  }

  function isVowel(c) {
    return VOWELS.includes(c);
  }

  // Letters grouped into units: digraphs (ch, ll, rr), the silent-u pairs (qu, gu before e/i) and final y
  // (which sounds like a vowel: rey, hoy) are handled here so the rest of the algorithm sees plain C/V units.
  function tokenize(word) {
    const w = word.toLowerCase();
    const units = [];
    let i = 0;
    while (i < w.length) {
      const c = w[i];
      const pair = w.slice(i, i + 2);
      if (pair === 'ch' || pair === 'll' || pair === 'rr') {
        units.push({ t: 'C', s: pair, at: i });
        i += 2;
      } else if ((c === 'q' || c === 'g') && w[i + 1] === 'u' && 'eiéí'.includes(w[i + 2] || '')) {
        units.push({ t: 'C', s: pair, at: i });
        i += 2;
      } else if (c === 'y' && i === w.length - 1 && i > 0 && isVowel(w[i - 1])) {
        units.push({ t: 'V', s: c, at: i });
        i += 1;
      } else {
        units.push({ t: isVowel(c) ? 'V' : 'C', s: c, at: i });
        i += 1;
      }
    }
    return units;
  }

  function isStrong(c) {
    return STRONG.includes(c);
  }

  // Two adjacent vowels belong to different syllables when both are open (a, e, o), when one is a stressed
  // closed vowel (í, ú) or when they are the same closed vowel (chiita).
  function isHiatus(a, b) {
    if (isStrong(a) && isStrong(b)) return true;
    if (STRESSED_WEAK.includes(a) || STRESSED_WEAK.includes(b)) return true;
    return a === b;
  }

  // How many consonant units of a cluster between two nuclei start the next syllable.
  function onsetLength(cs) {
    if (cs.length === 0) return 0;
    if (cs.length >= 2 && CLUSTERS.includes(cs[cs.length - 2].s + cs[cs.length - 1].s)) return 2;
    return 1;
  }

  function syllabify(word) {
    const units = tokenize(word);
    // Split into nuclei (arrays of vowel units) separated by consonant runs.
    const nuclei = [];
    const gaps = [[]]; // gaps[k] = consonants before nucleus k; last gap = trailing consonants
    let prevVowel = null;
    for (const u of units) {
      if (u.t === 'C') {
        gaps[gaps.length - 1].push(u);
        prevVowel = null;
      } else if (prevVowel && !isHiatus(prevVowel.s, u.s)) {
        nuclei[nuclei.length - 1].push(u);
        prevVowel = u;
      } else {
        nuclei.push([u]);
        gaps.push([]);
        prevVowel = u;
      }
    }
    if (nuclei.length === 0) return [word];
    const syllables = nuclei.map(() => '');
    const join = (arr) => arr.map((u) => u.s).join('');
    syllables[0] = join(gaps[0]);
    for (let k = 0; k < nuclei.length; k++) {
      syllables[k] += join(nuclei[k]);
      const cs = gaps[k + 1];
      if (k === nuclei.length - 1) {
        syllables[k] += join(cs);
      } else {
        const on = onsetLength(cs);
        syllables[k] += join(cs.slice(0, cs.length - on));
        syllables[k + 1] = join(cs.slice(cs.length - on));
      }
    }
    return syllables;
  }

  // Ends in a vowel, or in n / s right after a vowel (bíceps and robots behave as ending in a consonant).
  function endsInVowelNS(word) {
    const w = stripTildes(word.toLowerCase());
    const last = w[w.length - 1];
    if ('aeiou'.includes(last)) return true;
    if (last === 'n' || last === 's') return 'aeiou'.includes(w[w.length - 2] || '');
    return false;
  }

  // Index of the stressed syllable: the one with a tilde, otherwise the RAE default for the word ending.
  function stressIndex(syllables) {
    const marked = syllables.findIndex(hasTilde);
    if (marked >= 0) return marked;
    const n = syllables.length;
    if (n === 1) return 0;
    return endsInVowelNS(syllables.join('')) ? n - 2 : n - 1;
  }

  function classify(syllables) {
    const fromEnd = syllables.length - 1 - stressIndex(syllables);
    return CLASSES[Math.min(fromEnd, 3)];
  }

  // The stressed í/ú sits next to an open vowel (an h in between does not count): día, baúl, búho, prohíbe.
  function hasHiatusTilde(word) {
    const w = word.toLowerCase();
    for (let i = 0; i < w.length; i++) {
      if (!STRESSED_WEAK.includes(w[i])) continue;
      let p = i - 1;
      if (w[p] === 'h') p--;
      let n = i + 1;
      if (w[n] === 'h') n++;
      if (isStrong(w[p] || '') || isStrong(w[n] || '')) return true;
    }
    return false;
  }

  // Whether the correctly written word must carry a tilde, given its syllables and stress.
  function tildeRequired(syllables) {
    const word = syllables.join('');
    const cls = classify(syllables);
    const ends = endsInVowelNS(word);
    if (cls === 'esdrujula' || cls === 'sobresdrujula') return true;
    if (cls === 'aguda' && ends && syllables.length > 1) return true;
    if (cls === 'llana' && !ends) return true;
    return hasHiatusTilde(word);
  }

  // Letter positions where a tilde could be placed (vowels, except the silent u of que/gui and a final y).
  function tildeSlots(word) {
    return tokenize(stripTildes(word))
      .filter((u) => u.t === 'V' && u.s !== 'y' && u.s !== 'ü')
      .map((u) => u.at);
  }

  // Letter position of the tilde in the correct spelling, or -1 when the word has none.
  function tildePosition(word) {
    return word.search(/[áéíóú]/);
  }

  function parse(entry) {
    const syllables = entry.split('-');
    return { word: syllables.join(''), syllables, stress: stressIndex(syllables), cls: classify(syllables) };
  }

  const api = {
    CLASSES, CLASS_LABELS, stripTildes, hasTilde, tokenize, isHiatus, syllabify, endsInVowelNS,
    stressIndex, classify, hasHiatusTilde, tildeRequired, tildeSlots, tildePosition, parse,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.CE = root.CE || {}).syllables = api;
})(typeof window !== 'undefined' ? window : globalThis);
