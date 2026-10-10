// Tildes — the word arrives without any tilde; drop it on the right vowel or press SIN TILDE.
(function (root) {
  const { el, g, textWidth } = root.CE.svg;
  const { C, wordBox, button } = root.CE.sprites;

  const FONT = 72;
  const ACCENT = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

  function tildeMark() {
    return el('path', { d: 'M-8 12 L10 -14', class: 'tilde-mark' });
  }

  function build(task) {
    const letters = task.shown.split('');
    const widths = letters.map((ch) => textWidth(ch, FONT, 800));
    const inner = widths.reduce((a, b) => a + b, 0);
    const w = Math.max(260, inner + 110);
    const h = 160;
    const carrier = g({ class: 'carrier' }, [wordBox(w, h, C.white)]);
    const letterNodes = [];
    const centers = [];
    let x = -inner / 2;
    letters.forEach((ch, i) => {
      const cx = x + widths[i] / 2;
      centers.push(cx);
      const node = el('text', { x: cx, y: FONT * 0.36 + 10, class: 'word-text', 'text-anchor': 'middle', style: `font-size:${FONT}px` }, ch);
      letterNodes.push(node);
      x += widths[i];
    });

    // Slot order: every vowel left to right, then the SIN TILDE button.
    const slots = task.slots.slice();
    const slotNodes = slots.map((pos) => {
      const node = g({ 'data-act': 'slot', 'data-arg': pos, class: 'tappable vowel-slot' }, [
        el('rect', { x: centers[pos] - Math.max(widths[pos], 44) / 2 - 4, y: -h / 2 - 50, width: Math.max(widths[pos], 44) + 8, height: h + 40, rx: 18, class: 'slot-hit' }),
        g({ class: 'slot-cursor', transform: `translate(${centers[pos]} ${-FONT * 0.5})` }, [tildeMark()]),
      ]);
      return node;
    });
    letterNodes.forEach((n) => carrier.appendChild(n));
    slotNodes.forEach((n) => carrier.appendChild(n));

    const noTilde = g({ transform: 'translate(660 585)', 'data-act': 'notilde', class: 'tappable' }, [button('SIN TILDE', 320, 92, C.mint, { size: 40 })]);
    const fixed = g({ class: 'tilde-fixed' }, [
      noTilde,
      el('text', { x: 660, y: 670, class: 'key-badge', 'text-anchor': 'middle' }, 'tecla 0'),
    ]);

    let cursor = 0;
    const setCursor = (i) => {
      cursor = (i + slots.length + 1) % (slots.length + 1);
      slotNodes.forEach((n, k) => n.classList.toggle('selected', k === cursor));
      noTilde.querySelector('.button').classList.toggle('selected', cursor === slots.length);
    };
    setCursor(0);
    const choiceAt = (i) => (i === slots.length ? -1 : slots[i]);

    return {
      carrier,
      width: w,
      height: h,
      fixed,
      keysHelp: '← → mueve la tilde · Enter la suelta · 0 = sin tilde · o toca la vocal',
      handle(a) {
        if (a.type === 'key' && a.key === 'left') { setCursor(cursor - 1); return { moved: true }; }
        if (a.type === 'key' && a.key === 'right') { setCursor(cursor + 1); return { moved: true }; }
        if (a.type === 'key' && a.key === 'ok') return { choice: choiceAt(cursor) };
        if (a.type === 'digit' && a.n === 0) { setCursor(slots.length); return { choice: -1 }; }
        if (a.type === 'tap' && a.act === 'slot') return { choice: Number(a.arg) };
        if (a.type === 'tap' && a.act === 'notilde') return { choice: -1 };
        return null;
      },
      pointOf(choice) {
        return choice >= 0 ? { x: centers[choice], y: -FONT * 0.2 } : null;
      },
      fixedPoint: { x: 660, y: 585 },
      celebrate(ok, choice) {
        slotNodes.forEach((n) => n.classList.remove('selected'));
        if (choice >= 0 && ACCENT[letters[choice]]) {
          letterNodes[choice].textContent = ACCENT[letters[choice]];
          letterNodes[choice].classList.add(ok ? 'good-letter' : 'bad-letter');
        } else {
          noTilde.querySelector('.button').classList.add(ok ? 'good-button' : 'wrong');
        }
      },
      correctChoice: () => task.answer,
    };
  }

  ((root.CE = root.CE || {}).modes = root.CE.modes || {}).tilde = { build };
})(window);
