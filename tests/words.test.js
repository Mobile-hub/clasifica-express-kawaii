// Tests for js/words.js: every word must be correctly split and correctly accented. Run: node tests/words.test.js
const assert = require('assert');
const { test } = require('./harness.js');
const S = require('../js/syllables.js');
const W = require('../js/words.js');

const everyWord = W.ALL.concat(W.EGGS);

function failures(list, check) {
  return list.filter((w) => !check(w)).map((w) => `${w.theme}: ${w.entry}`);
}

function assertNone(list, label) {
  assert.ok(list.length === 0, `${list.length} ${label}:\n${list.join('\n')}`);
}

test('hyphenation matches the syllabifier (or is a listed exception)', () => {
  assertNone(failures(everyWord, (w) => W.SYLLABIFIER_EXCEPTIONS[w.entry] || S.syllabify(w.word).join('-') === w.entry), 'mismatches (entry vs syllabifier)');
});

test('every exception is used and really differs from the syllabifier', () => {
  for (const entry of Object.keys(W.SYLLABIFIER_EXCEPTIONS)) {
    assert.ok(everyWord.some((w) => w.entry === entry), `unused exception ${entry}`);
    assert.notStrictEqual(S.syllabify(entry.replace(/-/g, '')).join('-'), entry, `exception not needed: ${entry}`);
  }
});

test('every tilde is required by the rules, and only one per word', () => {
  assertNone(failures(everyWord, (w) => S.hasTilde(w.word) === S.tildeRequired(w.syllables)), 'tilde errors');
  assertNone(failures(everyWord, (w) => (w.word.match(/[áéíóú]/g) || []).length <= 1), 'words with two tildes');
});

test('lowercase letters only, at least two syllables, no -mente adverbs', () => {
  assertNone(failures(everyWord, (w) => /^[a-zñáéíóúü]+$/.test(w.word)), 'bad characters');
  assertNone(failures(everyWord, (w) => w.syllables.length >= 2), 'monosyllables');
  assertNone(failures(everyWord, (w) => !/mente$/.test(w.word)), '-mente adverbs');
});

test('no duplicates across themes', () => {
  const seen = new Map();
  const dups = [];
  for (const w of everyWord) {
    if (seen.has(w.word)) dups.push(`${w.word} (${seen.get(w.word)} / ${w.theme})`);
    seen.set(w.word, w.theme);
  }
  assertNone(dups, 'duplicates');
});

test('sobresdrújulas only appear as easter eggs', () => {
  assertNone(failures(W.ALL, (w) => w.cls !== 'sobresdrujula'), 'sobresdrújulas in the bank');
  assertNone(failures(W.EGGS, (w) => w.cls === 'sobresdrujula'), 'eggs that are not sobresdrújulas');
});

test('at least 800 words in total', () => {
  assert.ok(W.ALL.length >= 800, `only ${W.ALL.length} words`);
});

test('every tier has enough words of every class', () => {
  const MIN = { aguda: 15, llana: 30, esdrujula: 10 };
  const short = [];
  for (let tier = 1; tier <= 5; tier++) {
    for (const cls of Object.keys(MIN)) {
      const n = W.byTier(tier).filter((w) => w.cls === cls).length;
      if (tier < 5 && n < MIN[cls]) short.push(`tier ${tier} ${cls}: ${n} < ${MIN[cls]}`);
    }
  }
  assertNone(short, 'tiers short of words');
});

test('the Tildes mode has words with and without tilde in every tier', () => {
  for (let tier = 1; tier <= 5; tier++) {
    const usable = W.byTier(tier).filter((w) => !w.ambiguous);
    const withTilde = usable.filter((w) => S.hasTilde(w.word)).length;
    assert.ok(withTilde >= 15, `tier ${tier}: only ${withTilde} usable words with tilde`);
    if (tier < 5) assert.ok(usable.length - withTilde >= 15, `tier ${tier}: only ${usable.length - withTilde} without tilde`);
  }
});

test('tier examples', () => {
  const tierOfEntry = (e) => W.tierOf(S.parse(e));
  assert.strictEqual(tierOfEntry('ca-sa'), 1);
  assert.strictEqual(tierOfEntry('pá-ja-ro'), 1);
  assert.strictEqual(tierOfEntry('ár-bol'), 2);
  assert.strictEqual(tierOfEntry('can-ción'), 3);
  assert.strictEqual(tierOfEntry('le-ón'), 3);
  assert.strictEqual(tierOfEntry('ma-ri-po-sa'), 4);
  assert.strictEqual(tierOfEntry('dí-a'), 5);
});
