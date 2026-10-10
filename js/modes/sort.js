// Clasifica — send the word to the AGUDA, LLANA or ESDRÚJULA bin (and, for the easter egg, SOBRESDRÚJULA).
(function (root) {
  const { el, g, textWidth } = root.CE.svg;
  const { C, wordBox, bin } = root.CE.sprites;

  const FONT = 66;
  const BINS = [
    { cls: 'aguda', label: 'AGUDA', x: 380, key: '← 1' },
    { cls: 'llana', label: 'LLANA', x: 660, key: '↓ 2' },
    { cls: 'esdrujula', label: 'ESDRÚJULA', x: 940, key: '→ 3' },
  ];
  const EGG_BIN = { cls: 'sobresdrujula', label: '¡SOBRESDRÚJULA!', x: 1170, key: '↑ 4' };
  const BIN_Y = 582;
  const KEY_TO_CLASS = { left: 'aguda', down: 'llana', right: 'esdrujula', up: 'sobresdrujula' };
  const DIGIT_TO_CLASS = { 1: 'aguda', 2: 'llana', 3: 'esdrujula', 4: 'sobresdrujula' };

  function build(task) {
    const word = task.word.word;
    const w = Math.max(240, textWidth(word, FONT, 800) + 90);
    const h = 130;
    const carrier = g({ class: 'carrier' + (task.egg ? ' golden' : '') }, [
      wordBox(w, h, task.egg ? C.gold : C.white, task.egg ? 'wow' : 'happy'),
      el('text', { x: 0, y: FONT * 0.35, class: 'word-text', 'text-anchor': 'middle', style: `font-size:${FONT}px` }, word),
    ]);

    const bins = task.egg ? BINS.concat([EGG_BIN]) : BINS;
    const binNodes = {};
    const fixed = g({ class: 'bins' }, bins.map((b) => {
      const small = b === EGG_BIN;
      const node = g({ transform: `translate(${b.x} ${BIN_Y}) scale(${small ? 0.78 : 1})`, 'data-act': 'bin', 'data-arg': b.cls, class: 'tappable bin-slot' + (small ? ' egg-bin' : '') }, [
        el('rect', { x: -130, y: -110, width: 260, height: 260, fill: 'transparent' }),
        bin(b.cls, b.label, 210, 150, small ? 'wow' : 'happy'),
        el('text', { x: 0, y: -88, class: 'key-badge', 'text-anchor': 'middle' }, b.key),
      ]);
      binNodes[b.cls] = { node, x: b.x, y: BIN_Y - 40 };
      return node;
    }));

    const pick = (cls) => (binNodes[cls] ? { choice: cls } : null);

    return {
      carrier,
      width: w,
      height: h,
      fixed,
      keysHelp: null, // the key badges on the bins already say it
      handle(a) {
        if (a.type === 'key' && KEY_TO_CLASS[a.key]) return pick(KEY_TO_CLASS[a.key]);
        if (a.type === 'digit' && DIGIT_TO_CLASS[a.n]) return pick(DIGIT_TO_CLASS[a.n]);
        if (a.type === 'tap' && a.act === 'bin') return pick(a.arg);
        return null;
      },
      // Where the word flies to (in scene coordinates) when it is sorted.
      target(choice) {
        return binNodes[choice];
      },
      celebrate(ok, choice) {
        const b = binNodes[choice];
        if (b) b.node.classList.add(ok ? 'happy-bin' : 'wrong');
      },
      correctChoice: () => task.answer,
    };
  }

  ((root.CE = root.CE || {}).modes = root.CE.modes || {}).sort = { build, BINS };
})(window);
