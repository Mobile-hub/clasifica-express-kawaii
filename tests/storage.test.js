// Tests for js/storage.js with an in-memory store. Run: node tests/storage.test.js
const assert = require('assert');
const { test } = require('./harness.js');
const ST = require('../js/storage.js');

function memoryStore() {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

test('empty or broken storage gives a fresh record', () => {
  assert.deepStrictEqual(ST.load(memoryStore()), ST.empty());
  const s = memoryStore();
  s.setItem(ST.KEY, '{not json');
  assert.deepStrictEqual(ST.load(s), ST.empty());
  assert.deepStrictEqual(ST.load(null), ST.empty());
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepStrictEqual(ST.load(throwing), ST.empty());
  ST.save(ST.empty(), throwing); // must not throw
});

test('progress is cumulative and survives a reload', () => {
  const s = memoryStore();
  const p = ST.load(s);
  ST.recordClear(p, 1, 2, 900, 900);
  ST.recordClear(p, 1, 1, 500, 500); // a worse replay keeps the best stars and score
  ST.save(p, s);
  const q = ST.load(s);
  assert.deepStrictEqual(q.levels[1], { cleared: true, stars: 2, best: 900 });
  assert.strictEqual(q.best, 900);
});

test('clearing levels reports what has just unlocked', () => {
  const p = ST.empty();
  assert.deepStrictEqual(ST.recordClear(p, 1, 3, 100, 100), []);
  assert.deepStrictEqual(ST.recordClear(p, 2, 3, 100, 200), []);
  assert.deepStrictEqual(ST.recordClear(p, 3, 3, 100, 300), [4]);
  assert.deepStrictEqual(ST.recordClear(p, 4, 3, 100, 400), [5, 6, 7]);
  assert.ok(ST.isUnlocked(p, 7));
  assert.ok(!ST.isUnlocked(p, 8));
});

test('next level goes forward when open, otherwise to the first open level not cleared', () => {
  const p = ST.empty();
  ST.recordClear(p, 1, 3, 0, 0);
  assert.strictEqual(ST.nextLevel(p, 1), 2);
  ST.recordClear(p, 3, 3, 0, 0);
  assert.strictEqual(ST.nextLevel(p, 3), 2); // 4 still needs level 2
  for (let n = 1; n <= 20; n++) ST.recordClear(p, n, 3, 0, 0);
  assert.strictEqual(ST.nextLevel(p, 20), null);
});
