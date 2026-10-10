// Tests for js/levels.js and js/deck.js. Run: node tests/deck.test.js
const assert = require('assert');
const { test } = require('./harness.js');
const S = require('../js/syllables.js');
const W = require('../js/words.js');
const L = require('../js/levels.js');
const D = require('../js/deck.js');

const word = (entry) => Object.assign(S.parse(entry), { entry });

test('20 levels, 4 modes per world, harder as they go', () => {
  assert.strictEqual(L.LEVELS.length, 20);
  L.LEVELS.forEach((lv, i) => {
    assert.strictEqual(lv.n, i + 1);
    assert.strictEqual(lv.mode, L.MODES[i % 4]);
    const total = Object.values(lv.tiers).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `level ${lv.n} tier mix sums to ${total}`);
    if (i > 0) {
      assert.ok(lv.goal > L.LEVELS[i - 1].goal);
      assert.ok(lv.travel < L.LEVELS[i - 1].travel);
    }
  });
});

test('tasks: pop, sort and tilde answers', () => {
  const pop = D.makeTask(word('can-ción'), 'pop');
  assert.deepStrictEqual(pop.options, ['can', 'ción']);
  assert.strictEqual(pop.answer, 1);
  assert.strictEqual(D.makeTask(word('pá-ja-ro'), 'sort').answer, 'esdrujula');
  const t = D.makeTask(word('ár-bol'), 'tilde');
  assert.strictEqual(t.shown, 'arbol');
  assert.strictEqual(t.answer, 0);
  assert.ok(t.slots.includes(t.answer));
  assert.strictEqual(D.makeTask(word('me-sa'), 'tilde').answer, -1);
});

test('a level can be cleared answering everything right', () => {
  for (const lv of L.LEVELS) {
    const deck = new D.Deck(lv, D.makeRng(lv.n));
    let guard = 0;
    while (!deck.done && guard++ < 500) {
      const task = deck.next();
      deck.answer(task, true);
    }
    assert.ok(deck.done, `level ${lv.n} not cleared`);
    assert.ok(guard <= lv.goal + 5, `level ${lv.n} took ${guard} words`);
  }
});

test('no repeated words inside a level except retries', () => {
  const deck = new D.Deck(L.LEVELS[5], D.makeRng(7));
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const t = deck.next();
    if (!t.retry && !t.egg) {
      assert.ok(!seen.has(t.word.word), `repeated ${t.word.word}`);
      seen.add(t.word.word);
    }
    deck.answer(t, true);
  }
});

test('a missed word comes back 3 to 5 words later and blocks the level until solved', () => {
  const lv = Object.assign({}, L.LEVELS[1], { goal: 3, eggChance: 0 });
  const deck = new D.Deck(lv, D.makeRng(3));
  const missed = deck.next();
  deck.answer(missed, false);
  let back = -1;
  for (let i = 1; i <= 6; i++) {
    const t = deck.next();
    if (t.retry) {
      assert.strictEqual(t.word.word, missed.word.word);
      assert.strictEqual(t.mode, missed.mode);
      back = i;
      assert.ok(!deck.done, 'cleared with a retry still unanswered');
      deck.answer(t, true);
      break;
    }
    deck.answer(t, true);
    if (deck.correct >= lv.goal) assert.ok(!deck.done, 'cleared before solving the retry');
  }
  assert.ok(back >= 4 && back <= 6, `came back after ${back - 1} words`);
  assert.ok(deck.done);
});

test('sort decks are balanced between the three classes', () => {
  const deck = new D.Deck(L.LEVELS[1], D.makeRng(11));
  const count = { aguda: 0, llana: 0, esdrujula: 0 };
  for (let i = 0; i < 30; i++) count[deck.next().word.cls]++;
  for (const k of Object.keys(count)) assert.ok(count[k] >= 8, `${k}: ${count[k]}`);
});

test('the Tildes mode never uses ambiguous words and mixes words with and without tilde', () => {
  const deck = new D.Deck(L.LEVELS[2], D.makeRng(5));
  let withTilde = 0;
  for (let i = 0; i < 40; i++) {
    const t = deck.next();
    if (t.mode !== 'tilde') continue;
    assert.ok(!t.word.ambiguous, t.word.entry);
    if (t.answer >= 0) withTilde++;
  }
  assert.ok(withTilde >= 10 && withTilde <= 30, `${withTilde}/40 with tilde`);
});

test('express levels use all three modes', () => {
  const deck = new D.Deck(L.LEVELS[3], D.makeRng(9));
  const modes = new Set();
  for (let i = 0; i < 30; i++) modes.add(deck.next().mode);
  assert.deepStrictEqual([...modes].sort(), ['pop', 'sort', 'tilde']);
});

test('easter eggs appear only from world 3, are sorted and never cost the level', () => {
  const early = new D.Deck(L.LEVELS[7], D.makeRng(1));
  for (let i = 0; i < 200; i++) assert.ok(!early.next().egg);
  const lv = Object.assign({}, L.LEVELS[9], { eggChance: 1 });
  const deck = new D.Deck(lv, D.makeRng(1));
  const egg = deck.next();
  assert.ok(egg.egg);
  assert.strictEqual(egg.mode, 'sort');
  assert.strictEqual(egg.answer, 'sobresdrujula');
  deck.answer(egg, false);
  assert.strictEqual(deck.retries.length, 0);
});

test('combo multiplier and speed', () => {
  const c = new D.Combo(1.3);
  for (let i = 0; i < 4; i++) c.hit();
  assert.strictEqual(c.multiplier, 1);
  c.hit();
  assert.strictEqual(c.multiplier, 2);
  for (let i = 0; i < 40; i++) c.hit();
  assert.strictEqual(c.multiplier, 5);
  assert.strictEqual(c.speed, 1.3);
  c.miss();
  assert.strictEqual(c.multiplier, 1);
  assert.ok(c.speed < 1.3 && c.speed >= 1);
});

test('explanations name the class and the rule', () => {
  const cancion = D.explain(word('can-ción'));
  assert.match(cancion.lines[0], /última: es AGUDA/);
  assert.match(cancion.lines[2], /acaba en -n: lleva tilde/);
  assert.match(D.explain(word('re-loj')).lines[2], /acaba en -j: no lleva tilde/);
  assert.match(D.explain(word('ár-bol')).lines[2], /acaba en -l: lleva tilde/);
  assert.match(D.explain(word('pá-ja-ro')).lines[1], /siempre llevan tilde/);
  assert.match(D.explain(word('dí-a')).lines[1], /hiato/);
  assert.match(D.explain(W.EGGS[0]).lines[0], /SOBRESDRÚJULA/);
});

test('every word in the bank has an explanation', () => {
  for (const w of W.ALL.concat(W.EGGS)) assert.ok(D.explain(w).lines.length >= 2, w.entry);
});
