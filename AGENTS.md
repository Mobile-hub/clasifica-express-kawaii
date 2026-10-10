# AGENTS.md — Clasifica Express

Guide for agents (Claude Code or others) working in this repository.
Sister project of `../multiply`: same methodology, same constraints, different game.

## Rules
- Code, identifiers, documentation and comments in **English**. Everything the player sees (UI strings, words, messages) in **Spanish (Castilian)** — this is a Spanish spelling game. Conversations and development plans with the maintainer in **Spanish (Castilian)**. Committed files in **English** (except Spanish game literals and the word bank).
- No dependencies, no build, no network at runtime: HTML + CSS + classic JS (plain `<script>` tags, NOT ES modules) so it works by opening `index.html` via `file://`. Everything hangs off the global `window.CE` namespace.
- Pure logic modules (`syllables`, `words`, `levels`, `deck`) use the same dual export as multiply: `module.exports` in node, `window.CE.<name>` in the browser. They must not touch the DOM.
- MIT license. Small, frequent commits. **Never push, publish or deploy** without explicit approval from the maintainer.
- `make open` opens the game, `make test` runs tests with node, `make check` validates syntax, `make dist` builds the publishable copy in `dist/`.
- Education first: the arcade layer must never distract from the spelling concept. One clear task on screen at a time, big targets, no reading-heavy UI, no time pressure on the menu.
- Every interaction must be doable with **keyboard only**, **mouse only** or **touch only**.
- Language correctness is non-negotiable: every word in the bank must pass the syllabification and accent-rule tests (RAE general rules). When in doubt about a word, leave it out.

## Accepted plan (draft, pending maintainer review)

### Concept
Words travel along a conveyor belt; the player works on the stressed syllable (*sílaba tónica*), the word class (*aguda / llana / esdrújula*) and the written accent (*tilde*). The more correct answers in a row, the faster the belt and the bigger the combo multiplier.

### Technical decisions
- **Vanilla JS + inline SVG**, no framework. A single `<svg viewBox="0 0 1280 720">` stage scaled to fit the screen (16:9, letterboxed). SVG gives crisp kawaii vectors, native hit-testing for mouse/touch and CSS animations, with nothing to build.
- Art is hand-written SVG in `js/sprites.js` (functions returning SVG nodes): pastel palette, thick rounded outlines, blush cheeks, dot eyes. No bitmap images.
- Typography: rounded system font stack; an OFL font may be bundled later under `assets/fonts/` (with its license) if the maintainer agrees.
- Sound: WebAudio synthesized, soft sine/triangle "blips" + a gentle looping tune. `M` = mute. No speech synthesis (it would give away the stress).
- Best score and per-level stars in `localStorage` (always wrapped in try/catch; the game must work without it).
- `make dist` copies only the runtime files (`index.html`, `css/`, `js/`, `assets/`) to `dist/`, ready to be uploaded to the AFA website under `/games/clasifica-express/`.

### Language model (`js/syllables.js`, pure, tested)
- Words are stored hyphenated by syllable, e.g. `can-ción`, `pá-ja-ro`, `ár-bol`, `dí-a`.
- The stressed syllable is **derived**, never stored: a tilde marks it; otherwise the RAE rule applies (ends in vowel, `n` or `s` → penultimate; otherwise → last; final `y` counts as a consonant).
- Class: last = *aguda*, penultimate = *llana*, antepenultimate = *esdrújula* (earlier = *sobresdrújula*).
- Tilde check: a word needs a tilde if (aguda ending in vowel/n/s) or (llana not ending in vowel/n/s) or (esdrújula/sobresdrújula) or (stressed `i`/`u` in hiatus with an open vowel: `dí-a`, `ba-úl`).
- A syllabifier (vowels, diphthongs, triphthongs, hiatus, inseparable clusters `pl br tr ch ll rr`…) cross-checks every hand-written hyphenation; mismatches fail the tests unless listed in an explicit, commented exception list.
- Excluded from the bank: monosyllables, diacritical tildes (`té/te`, `más/mas`), interrogatives, proper nouns, prefix-sensitive words (`sub-ra-yar`), loanwords, anything not suitable for children.

### Sub-games (one arcade skin each, all on the same belt)
1. **¡Pop! — find the stressed syllable.** The word arrives split into syllable bubbles; pop the stressed one. Keys: `1`…`n` or `←/→` + `Enter`/`Space`; click/tap the bubble.
2. **Clasifica — sort the word.** The word rides the belt towards three kawaii bins: *AGUDA · LLANA · ESDRÚJULA*. Keys: `←` `↓` `→` (or `1` `2` `3`); click/tap a bin; swipe the word on touch.
3. **Tildes — place the accent.** The word arrives written without any tilde; drop the tilde on the right vowel or press *SIN TILDE*. Keys: `←/→` to move the tilde over the vowels/"sin tilde" slot + `Enter`/`Space`; click/tap a vowel or the button. Roughly half the words in this mode need no tilde.
4. **Express — mixed.** Each word comes with one of the three tasks above, chosen at random.

### Rules of play
- 5 hearts. A wrong answer or a word falling off the belt costs a heart; the word goes back into the queue.
- **No hints and no answer reveal** (same principle as multiply). The mascot, *Tildi* (a cute accent-mark creature), reacts with emotions only.
- Combo: every 5 correct answers in a row raises the multiplier (×1 → ×5, capped); a mistake resets it. Each correct answer slightly speeds up the belt (capped per level); a mistake slows it down a little.
- A level is cleared after N correct words (N grows with the level). Stars (1–3) depend on hearts left.
- Game over → retry the level or back to the menu. All 20 levels are selectable from the menu; stars show progress.

### 20 levels (5 worlds × 4 levels)
Each world uses a word tier; inside a world the order is ¡Pop! → Clasifica → Tildes → Express. Tiers accumulate (a world also draws some words from earlier tiers).

| World | Levels | Word tier |
| --- | --- | --- |
| 1 | 1–4 | 2 syllables, open syllables, very common words (`ca-sa`, `so-fá`, `me-sa`) + easy esdrújulas (`pá-ja-ro`) |
| 2 | 5–8 | 3 syllables, closed syllables and clusters (`plan-ta`, `li-bro`, `ár-bol`, `lá-piz`) |
| 3 | 9–12 | diphthongs and triphthongs (`can-ción`, `puer-ta`, `nie-ve`, `buey`), endings other than vowel/n/s (`re-loj`, `ciu-dad`) |
| 4 | 13–16 | 4+ syllables, plural stress shifts (`can-ción → can-cio-nes`, `e-xa-men → e-xá-me-nes`) |
| 5 | 17–20 | hiatus with tilde (`dí-a`, `ma-íz`, `bú-ho`), everything mixed and faster; level 20 is the grand final |

Target: at least 800 words in total, balanced between agudas, llanas and esdrújulas, and between words with and without tilde. Tests enforce minimum counts per tier and class.

### Structure
```
index.html, css/style.css
js/syllables.js  syllabifier, stress, class and tilde rules (pure, tested)
js/words.js      word bank by tier, Spanish (pure, tested)
js/levels.js     the 20 level definitions (pure, tested)
js/deck.js       per-level word queue, re-queue on miss, tilde stripping, combo/score (pure, tested)
js/audio.js      WebAudio synth
js/input.js      mouse / touch / keyboard → abstract actions
js/sprites.js    kawaii SVG art (belt, bins, bubbles, Tildi, hearts)
js/fx.js         confetti, sparkles, floating texts, shake
js/modes/*.js    pop.js, sort.js, tilde.js, express.js
js/game.js       state machine: menu, level intro, play, level clear, game over, victory
js/main.js       loop and boot
tests/*.test.js  node tests, no deps
Makefile, LICENSE, README.md
```

### Debug URL parameters (dev only)
`index.html?level=N` (jump to a level), `&mode=pop|sort|tilde|express`, `&auto=1` (bot answers correctly), `&seed=N` (deterministic order), `&screen=clear|gameover|victory`. Use them with headless Chrome to take screenshots and check every screen without playing it by hand.

### Publishing (only after maintainer approval)
`make dist`, then upload `dist/` to `/games/clasifica-express/` on the AFA website (same channel as multiply) and add the link to `games/index.html`.
