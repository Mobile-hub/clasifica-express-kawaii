// Tests for js/syllables.js. Run: node tests/syllables.test.js
const assert = require('assert');
const { test } = require('./harness.js');
const S = require('../js/syllables.js');

const split = (w) => S.syllabify(w).join('-');

test('syllabifies open and closed syllables', () => {
  assert.strictEqual(split('casa'), 'ca-sa');
  assert.strictEqual(split('árbol'), 'ár-bol');
  assert.strictEqual(split('instante'), 'ins-tan-te');
  assert.strictEqual(split('examen'), 'e-xa-men');
});

test('keeps inseparable clusters and digraphs together', () => {
  assert.strictEqual(split('hombre'), 'hom-bre');
  assert.strictEqual(split('planta'), 'plan-ta');
  assert.strictEqual(split('perro'), 'pe-rro');
  assert.strictEqual(split('caballo'), 'ca-ba-llo');
  assert.strictEqual(split('noche'), 'no-che');
  assert.strictEqual(split('construir'), 'cons-truir');
});

test('treats qu / gu before e, i as a single consonant', () => {
  assert.strictEqual(split('queso'), 'que-so');
  assert.strictEqual(split('guitarra'), 'gui-ta-rra');
  assert.strictEqual(split('pingüino'), 'pin-güi-no');
  assert.strictEqual(split('guapo'), 'gua-po');
});

test('diphthongs, triphthongs and final y', () => {
  assert.strictEqual(split('canción'), 'can-ción');
  assert.strictEqual(split('puerta'), 'puer-ta');
  assert.strictEqual(split('ciudad'), 'ciu-dad');
  assert.strictEqual(split('buey'), 'buey');
  assert.strictEqual(split('jersey'), 'jer-sey');
  assert.strictEqual(split('mayo'), 'ma-yo');
});

test('hiatus between open vowels and with stressed í / ú', () => {
  assert.strictEqual(split('poeta'), 'po-e-ta');
  assert.strictEqual(split('león'), 'le-ón');
  assert.strictEqual(split('día'), 'dí-a');
  assert.strictEqual(split('maíz'), 'ma-íz');
  assert.strictEqual(split('baúl'), 'ba-úl');
  assert.strictEqual(split('búho'), 'bú-ho');
  assert.strictEqual(split('zanahoria'), 'za-na-ho-ria');
});

test('stress follows the tilde or the default rule', () => {
  assert.strictEqual(S.stressIndex(['ca', 'sa']), 0);
  assert.strictEqual(S.stressIndex(['re', 'loj']), 1);
  assert.strictEqual(S.stressIndex(['ca', 'mión']), 1);
  assert.strictEqual(S.stressIndex(['pá', 'ja', 'ro']), 0);
  assert.strictEqual(S.stressIndex(['jer', 'sey']), 1);
  assert.strictEqual(S.stressIndex(['ro', 'bots']), 1);
});

test('classifies agudas, llanas, esdrújulas and sobresdrújulas', () => {
  assert.strictEqual(S.classify(['ra', 'tón']), 'aguda');
  assert.strictEqual(S.classify(['pa', 'red']), 'aguda');
  assert.strictEqual(S.classify(['me', 'sa']), 'llana');
  assert.strictEqual(S.classify(['lá', 'piz']), 'llana');
  assert.strictEqual(S.classify(['mú', 'si', 'ca']), 'esdrujula');
  assert.strictEqual(S.classify(['dí', 'ga', 'me', 'lo']), 'sobresdrujula');
});

test('tilde rules: general rule and hiatus', () => {
  assert.strictEqual(S.tildeRequired(['ca', 'fé']), true);
  assert.strictEqual(S.tildeRequired(['re', 'loj']), false);
  assert.strictEqual(S.tildeRequired(['ár', 'bol']), true);
  assert.strictEqual(S.tildeRequired(['me', 'sa']), false);
  assert.strictEqual(S.tildeRequired(['bí', 'ceps']), true);
  assert.strictEqual(S.tildeRequired(['dí', 'a']), true);
  assert.strictEqual(S.tildeRequired(['ba', 'úl']), true);
  assert.strictEqual(S.tildeRequired(['bú', 'ho']), true);
  assert.strictEqual(S.tildeRequired(['e', 'xá', 'men']), false);
});

test('tilde slots skip the silent u and final y', () => {
  assert.deepStrictEqual(S.tildeSlots('queso'), [2, 4]);
  assert.deepStrictEqual(S.tildeSlots('cancion'), [1, 4, 5]);
  assert.deepStrictEqual(S.tildeSlots('jersey'), [1, 4]);
  assert.strictEqual(S.tildePosition('canción'), 5);
  assert.strictEqual(S.tildePosition('mesa'), -1);
});

test('stripTildes keeps ü and ñ', () => {
  assert.strictEqual(S.stripTildes('pingüino'), 'pingüino');
  assert.strictEqual(S.stripTildes('cigüeña'), 'cigüeña');
  assert.strictEqual(S.stripTildes('pájaro'), 'pajaro');
});
