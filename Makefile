.PHONY: open serve test check dist clean help

PORT ?= 8000
JS := $(wildcard js/*.js) $(wildcard js/modes/*.js) $(wildcard tests/*.js)
TESTS := $(wildcard tests/*.test.js)
RUNTIME := index.html css js LICENSE $(wildcard assets)

help:
	@echo "make open   - open the game in the default browser"
	@echo "make serve  - serve the game on http://localhost:$(PORT)"
	@echo "make test   - run unit tests (node)"
	@echo "make check  - syntax-check every JS file (node)"
	@echo "make dist   - copy the publishable files to dist/"
	@echo "make clean  - remove dist/"

open:
	xdg-open index.html >/dev/null 2>&1 || open index.html

serve:
	python3 -m http.server $(PORT)

test:
	@for f in $(TESTS); do echo "# $$f"; node $$f || exit 1; done; echo "tests OK"

check:
	@for f in $(JS); do node --check $$f || exit 1; done && echo "syntax OK"

dist: check test clean
	mkdir -p dist
	cp -r $(RUNTIME) dist/
	@echo "dist/ ready: upload its contents to /games/clasifica-express/"

clean:
	rm -rf dist
