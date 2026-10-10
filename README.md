# Clasifica Express 🍡

A tiny kawaii arcade game to practise Spanish stress and written accents: find the stressed syllable (*sílaba tónica*), sort words into *aguda / llana / esdrújula*, and place the *tilde*.
The game itself is in Spanish. Pure HTML + CSS + JavaScript with SVG art: no dependencies, no build step, no network. Works offline by opening `index.html`.

> Work in progress. See [AGENTS.md](AGENTS.md) for the design plan.

## Play

```sh
make open    # open index.html in your default browser
make serve   # or serve it on http://localhost:8000
```

## Development

```sh
make test    # unit tests for syllables, words and levels (node, no deps)
make check   # syntax-check every JS file
make dist    # copy the publishable files to dist/
```

## License

MIT, see [LICENSE](LICENSE).
