// ¡Pop! — the word arrives split into syllable bubbles; pop the stressed one.
// Every mode builds the same shape of object, see game.js (carrier, fixed, handle, celebrate, correctChoice).
(function (root) {
  const { el, g, textWidth } = root.CE.svg;
  const { C, wordBox, bubble } = root.CE.sprites;

  const FONT = 62;
  const BH = 96;
  const GAP = 16;
  const PAD = 34;
  const COLORS = [C.sky, C.mint, C.lemon, C.lilac, C.peach];

  function build(task) {
    const widths = task.options.map((s) => Math.max(BH, textWidth(s, FONT, 800) + 48));
    const inner = widths.reduce((a, b) => a + b, 0) + GAP * (widths.length - 1);
    const w = inner + PAD * 2;
    const h = BH + 70;
    const bubbles = [];
    const carrier = g({ class: 'carrier' }, [wordBox(w, h, C.white)]);
    let x = -inner / 2;
    const top = -12;
    task.options.forEach((syl, i) => {
      const bw = widths[i];
      const node = g({ transform: `translate(${x + bw / 2} ${top})`, 'data-act': 'syl', 'data-arg': i, class: 'tappable' }, [
        bubble(bw, BH, COLORS[i % COLORS.length]),
        el('rect', { x: -bw / 2 + 16, y: BH / 2 + 5, width: bw - 32, height: 7, rx: 3.5, class: 'caret' }),
        el('text', { x: 0, y: FONT * 0.35, class: 'word-text', 'text-anchor': 'middle', style: `font-size:${FONT}px` }, syl),
        el('text', { x: 0, y: BH / 2 + 32, class: 'key-badge', 'text-anchor': 'middle' }, String(i + 1)),
      ]);
      node.cx = x + bw / 2;
      bubbles.push(node);
      carrier.appendChild(node);
      x += bw + GAP;
    });

    // No option is preselected: the blinking underline only appears once the arrows are used.
    let cursor = -1;
    const setCursor = (i) => {
      cursor = (i + bubbles.length) % bubbles.length;
      bubbles.forEach((b, k) => b.classList.toggle('selected', k === cursor));
    };

    return {
      carrier,
      width: w,
      height: h,
      fixed: null,
      keysHelp: 'Toca la burbuja · o pulsa su número · o ← → y Enter',
      handle(a) {
        if (a.type === 'key' && a.key === 'left') { setCursor(cursor < 0 ? bubbles.length - 1 : cursor - 1); return { moved: true }; }
        if (a.type === 'key' && a.key === 'right') { setCursor(cursor + 1); return { moved: true }; }
        if (a.type === 'key' && a.key === 'ok') return cursor < 0 ? null : { choice: cursor };
        if (a.type === 'digit' && a.n >= 1 && a.n <= bubbles.length) { setCursor(a.n - 1); return { choice: a.n - 1 }; }
        if (a.type === 'tap' && a.act === 'syl') { setCursor(Number(a.arg)); return { choice: Number(a.arg) }; }
        return null;
      },
      // Local offset of the chosen bubble inside the carrier, for effects.
      pointOf(choice) {
        return { x: bubbles[choice] ? bubbles[choice].cx : 0, y: top };
      },
      celebrate(ok, choice) {
        const b = bubbles[choice];
        if (!b) return;
        b.classList.add(ok ? 'popped' : 'wrong');
      },
      correctChoice: () => task.answer,
    };
  }

  ((root.CE = root.CE || {}).modes = root.CE.modes || {}).pop = { build };
})(window);
