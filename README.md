# Clasifica Express 🍡

A tiny kawaii arcade game to practise Spanish stress and written accents, for children in 3rd–6th grade of primary school.
Words ride a conveyor belt: find the stressed syllable (*sílaba tónica*), sort them into *aguda / llana / esdrújula*, and place the *tilde*.
The game itself is in Spanish. Pure HTML + CSS + JavaScript with SVG art: no dependencies, no build step, no network. Works offline by opening `index.html`.

## Play

```sh
make open    # open index.html in your default browser
make serve   # or serve it on http://localhost:8000
```

## How it works

- **20 levels** in 5 worlds (Pastelería, Jardín, Playa, Ciudad, Espacio). Each world has four levels, one per mode:
  - **¡Pop!**: the word arrives split into syllable bubbles; pop the stressed one.
  - **Clasifica**: send the word to the AGUDA, LLANA or ESDRÚJULA bin.
  - **Tildes**: the word arrives without tildes; put the tilde on the right vowel, or press SIN TILDE.
  - **Express**: every word brings one of the three tasks.
- Words get harder world by world: short words of simple syllables, then consonant clusters and closed syllables, diphthongs, long words, and finally hiatus with tilde (*día*, *maíz*, *búho*).
- The more correct answers in a row, the faster the belt and the bigger the combo (up to ×5).
- 5 hearts per level. After a mistake, **Tildi** (the mascot) shows why: the stressed syllable, the word class and the tilde rule. That word comes back later in the same level and must be solved before the level is cleared.
- Clear a level with enough correct answers; you get 1–3 stars depending on the hearts left. Stars and the high score are saved in the browser.
- Easter egg: from world 3 on, a golden *sobresdrújula* may show up… with a secret fourth bin.

## Controls

| Action | Keyboard | Mouse / touch |
| --- | --- | --- |
| ¡Pop! | `←` `→` + `Enter`, or `1`…`n` | tap the bubble |
| Clasifica | `←` `↓` `→` or `1` `2` `3` (`↑` / `4` for the golden word) | tap the bin |
| Tildes | `←` `→` + `Enter`, `0` = sin tilde | tap the vowel or SIN TILDE |
| Menus and cards | arrows + `Enter` / `Space` | tap |
| Pause | `P` or `Esc` | ⏸ button |
| Sound on/off | `M` | speaker button |

## Word bank

About 1000 words, written split by syllable (`can-ción`, `pá-ja-ro`) in [js/words.js](js/words.js). The stressed syllable and the class are never stored: they are derived from the spelling with the RAE rules in [js/syllables.js](js/syllables.js). The tests check that every hyphenation matches an automatic syllabifier and that every tilde is required by the rules. Words marked with `*` (`*papá`, `*saltó`) are another valid word with or without the tilde, so they are left out of the Tildes mode.

## Development

```sh
make test    # unit tests: syllables, word bank, levels and deck (node, no deps)
make check   # syntax-check every JS file
make dist    # run checks and tests, then copy the publishable files to dist/
```

Debug URL parameters, headless checks and the project layout are described in [AGENTS.md](AGENTS.md).

## License

Code: MIT, see [LICENSE](LICENSE). Fonts: [Fredoka](https://github.com/hafontia/Fredoka-One) and [Nunito](https://github.com/googlefonts/nunito), SIL Open Font License 1.1 (see `assets/fonts/`).
