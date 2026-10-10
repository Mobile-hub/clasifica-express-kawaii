// Kawaii vector art: every function returns a fresh SVG group drawn around (0, 0).
(function (root) {
  const { el, g } = root.CE.svg;

  const C = {
    ink: '#5b3a55',
    white: '#fffaf5',
    cream: '#fff3e6',
    pink: '#ff9ec7',
    pinkDeep: '#ff6fa8',
    blush: '#ff8fb1',
    mint: '#a8ecc8',
    sky: '#9fd8ff',
    lilac: '#cdb6ff',
    lemon: '#ffe27a',
    peach: '#ffc4a3',
    gold: '#ffd447',
    grey: '#d9cfd6',
  };

  const CLASS_COLOR = { aguda: C.sky, llana: C.mint, esdrujula: C.lilac, sobresdrujula: C.gold };
  const STROKE = { stroke: C.ink, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

  let uid = 0;
  const nextId = (p) => `${p}${++uid}`;

  // Dot eyes, blush and a mouth. mood: happy | joy | sad | wow | wink
  function face(mood, s) {
    s = s || 1;
    const eyeY = -4 * s;
    const parts = [];
    if (mood === 'joy' || mood === 'wink') {
      parts.push(el('path', { d: `M${-20 * s} ${eyeY + 3 * s} q${6 * s} ${-9 * s} ${12 * s} 0`, fill: 'none', ...STROKE, 'stroke-width': 4 * s }));
      if (mood === 'joy') parts.push(el('path', { d: `M${8 * s} ${eyeY + 3 * s} q${6 * s} ${-9 * s} ${12 * s} 0`, fill: 'none', ...STROKE, 'stroke-width': 4 * s }));
      else parts.push(el('ellipse', { cx: 14 * s, cy: eyeY, rx: 4.5 * s, ry: 6 * s, fill: C.ink }));
    } else {
      for (const x of [-14, 14]) {
        parts.push(el('ellipse', { cx: x * s, cy: eyeY, rx: 4.5 * s, ry: 6 * s, fill: C.ink }));
        parts.push(el('circle', { cx: (x + 1.8) * s, cy: eyeY - 2.4 * s, r: 1.7 * s, fill: '#fff' }));
      }
    }
    for (const x of [-26, 26]) parts.push(el('ellipse', { cx: x * s, cy: 9 * s, rx: 7 * s, ry: 4.5 * s, fill: C.blush, opacity: 0.6 }));
    if (mood === 'sad') {
      parts.push(el('path', { d: `M${-7 * s} ${13 * s} q${7 * s} ${-7 * s} ${14 * s} 0`, fill: 'none', ...STROKE, 'stroke-width': 3.5 * s }));
    } else if (mood === 'wow') {
      parts.push(el('ellipse', { cx: 0, cy: 11 * s, rx: 5 * s, ry: 6 * s, fill: C.ink }));
    } else if (mood === 'joy') {
      parts.push(el('path', { d: `M${-9 * s} ${7 * s} q${9 * s} ${13 * s} ${18 * s} 0 z`, fill: C.pinkDeep, ...STROKE, 'stroke-width': 3 * s }));
    } else {
      parts.push(el('path', { d: `M${-7 * s} ${8 * s} q${3.5 * s} ${5 * s} ${7 * s} 0 q${3.5 * s} ${5 * s} ${7 * s} 0`, fill: 'none', ...STROKE, 'stroke-width': 3.5 * s }));
    }
    return g({ class: 'face' }, parts);
  }

  function roundRect(w, h, r, fill, extra) {
    return el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: r, fill, ...STROKE, ...(extra || {}) });
  }

  // The word carrier: a mochi box with a little face peeking over the top edge and two wheels.
  function wordBox(w, h, fill, mood) {
    return g({ class: 'word-box' }, [
      el('circle', { cx: -w / 2 + 40, cy: h / 2 + 4, r: 13, fill: C.grey, ...STROKE, 'stroke-width': 4 }),
      el('circle', { cx: w / 2 - 40, cy: h / 2 + 4, r: 13, fill: C.grey, ...STROKE, 'stroke-width': 4 }),
      el('ellipse', { cx: 0, cy: -h / 2 + 2, rx: 46, ry: 34, fill, ...STROKE }),
      roundRect(w, h, 30, fill),
      el('rect', { x: -w / 2 + 18, y: -h / 2 + 12, width: Math.max(10, w - 36), height: 10, rx: 5, fill: '#fff', opacity: 0.55 }),
      g({ transform: `translate(0 ${-h / 2 - 8}) scale(0.72)` }, [face(mood || 'happy')]),
    ]);
  }

  // Bubble for one syllable in ¡Pop!
  function bubble(w, h, fill) {
    return g({ class: 'bubble' }, [
      roundRect(w, h, h / 2, fill),
      el('ellipse', { cx: -w / 2 + h / 3, cy: -h / 4, rx: 10, ry: 6, fill: '#fff', opacity: 0.8, transform: `rotate(-30 ${-w / 2 + h / 3} ${-h / 4})` }),
    ]);
  }

  // Three dots that show where the stress falls, with the stressed one big: ○○● aguda, ○●○ llana, ●○○ esdrújula.
  function stressDots(cls) {
    const pos = { aguda: 3, llana: 2, esdrujula: 1, sobresdrujula: 0 }[cls];
    const n = cls === 'sobresdrujula' ? 4 : 3;
    const parts = [];
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 30;
      const big = i === (cls === 'sobresdrujula' ? 0 : pos - 1);
      parts.push(el('circle', { cx: x, cy: 0, r: big ? 11 : 6, fill: big ? C.ink : '#fff', stroke: C.ink, 'stroke-width': 3 }));
    }
    return g({ class: 'stress-dots' }, parts);
  }

  // Sorting bin with a face, its label banner and the stress dots.
  function bin(cls, label, w, h, mood) {
    const fill = CLASS_COLOR[cls];
    const top = -h / 2;
    const bw = w * 0.82;
    const body = `M${-w / 2} ${top + 24} L${w / 2} ${top + 24} L${bw / 2} ${h / 2 - 18} Q${bw / 2} ${h / 2} ${bw / 2 - 18} ${h / 2} L${-bw / 2 + 18} ${h / 2} Q${-bw / 2} ${h / 2} ${-bw / 2} ${h / 2 - 18} Z`;
    return g({ class: 'bin' }, [
      el('path', { d: body, fill, ...STROKE }),
      el('rect', { x: -w / 2 - 10, y: top, width: w + 20, height: 34, rx: 17, fill, ...STROKE }),
      el('rect', { x: -w / 2 + 6, y: top + 7, width: w - 40, height: 8, rx: 4, fill: '#fff', opacity: 0.6 }),
      g({ transform: `translate(0 ${top + 82})` }, [face(mood || 'happy', 0.95)]),
      g({ transform: `translate(0 ${top + 136})` }, [stressDots(cls)]),
      el('text', { x: 0, y: h / 2 + 40, class: 'bin-label', 'text-anchor': 'middle' }, label),
    ]);
  }

  function heart(full) {
    return el('path', {
      d: 'M0 12 C-4 8 -22 -2 -22 -14 C-22 -24 -12 -28 -6 -24 C-3 -22 -1 -19 0 -16 C1 -19 3 -22 6 -24 C12 -28 22 -24 22 -14 C22 -2 4 8 0 12 Z',
      fill: full ? C.pinkDeep : '#fff',
      ...STROKE,
      'stroke-width': 4,
      opacity: full ? 1 : 0.7,
    });
  }

  function star(filled, r) {
    r = r || 30;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.48 : r;
      pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
    }
    return el('polygon', { points: pts.join(' '), fill: filled ? C.gold : '#fff', ...STROKE, 'stroke-width': 4, opacity: filled ? 1 : 0.6 });
  }

  // Tildi, the mascot: a chubby accent mark (´) with a face.
  function tildi(mood) {
    return g({ class: 'tildi' }, [
      el('ellipse', { cx: 0, cy: 92, rx: 46, ry: 9, fill: C.ink, opacity: 0.15 }),
      g({ transform: 'rotate(28)' }, [
        el('rect', { x: -40, y: -78, width: 80, height: 156, rx: 40, fill: C.pink, ...STROKE }),
        el('rect', { x: -26, y: -64, width: 14, height: 46, rx: 7, fill: '#fff', opacity: 0.55 }),
      ]),
      g({ transform: 'translate(4 10)' }, [face(mood || 'happy', 1.05)]),
      el('path', { d: 'M-46 30 q-18 6 -20 20', fill: 'none', ...STROKE }),
      el('path', { d: 'M40 -6 q20 -2 26 -18', fill: 'none', ...STROKE }),
    ]);
  }

  // Conveyor belt from x1 to x2, top edge at y. Returns the group; its .stripes child is animated by the game.
  function belt(x1, x2, y) {
    const w = x2 - x1;
    const stripes = el('line', { x1: x1 + 30, y1: y + 22, x2: x2 - 30, y2: y + 22, stroke: '#fff', 'stroke-width': 8, 'stroke-dasharray': '26 30', 'stroke-linecap': 'round', opacity: 0.7 });
    const rollers = [];
    for (let x = x1 + 30; x <= x2 - 30; x += 70) rollers.push(el('circle', { cx: x, cy: y + 62, r: 9, fill: C.grey, ...STROKE, 'stroke-width': 3 }));
    const group = g({ class: 'belt' }, [
      el('rect', { x: x1 - 8, y: y + 40, width: w + 16, height: 44, rx: 22, fill: '#b9a7c4', ...STROKE }),
      ...rollers,
      el('rect', { x: x1, y, width: w, height: 44, rx: 22, fill: '#8f7aa3', ...STROKE }),
      stripes,
    ]);
    group.stripes = stripes;
    return group;
  }

  function button(label, w, h, fill, opts) {
    opts = opts || {};
    return g({ class: 'button' + (opts.selected ? ' selected' : '') }, [
      el('rect', { x: -w / 2 - 8, y: -h / 2 - 8, width: w + 16, height: h + 16, rx: h / 2 + 8, class: 'focus-ring' }),
      el('rect', { x: -w / 2, y: -h / 2 + 6, width: w, height: h, rx: h / 2, fill: C.ink, opacity: 0.25 }),
      el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: fill || C.pink, ...STROKE }),
      el('text', { x: 0, y: opts.size ? opts.size * 0.36 : 11, class: 'button-label', 'text-anchor': 'middle', style: opts.size ? `font-size:${opts.size}px` : null }, label),
    ]);
  }

  function cloud(s) {
    return g({ transform: `scale(${s || 1})`, opacity: 0.9 }, [
      el('path', { d: 'M-60 20 Q-70 -10 -40 -14 Q-34 -40 -6 -34 Q12 -54 36 -34 Q66 -36 62 -6 Q82 6 64 22 Z', fill: '#fff', stroke: C.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' }),
    ]);
  }

  function flower(color, s) {
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 * Math.PI) / 180;
      petals.push(el('circle', { cx: Math.cos(a) * 16, cy: Math.sin(a) * 16, r: 13, fill: color, stroke: C.ink, 'stroke-width': 3 }));
    }
    return g({ transform: `scale(${s || 1})` }, [...petals, el('circle', { cx: 0, cy: 0, r: 10, fill: C.lemon, stroke: C.ink, 'stroke-width': 3 })]);
  }

  // Decorated background for a world theme: cake | garden | beach | city | space | menu
  function background(theme) {
    const id = nextId('bg');
    const grad = {
      menu: ['#ffe4ef', '#fff3e6'],
      cake: ['#ffe4ef', '#fff3e6'],
      garden: ['#e1f8e8', '#fff8d6'],
      beach: ['#d9f3ff', '#fff0d9'],
      city: ['#ece3ff', '#ffe9f3'],
      space: ['#2f2b5e', '#5c4290'],
    }[theme] || ['#ffe4ef', '#fff3e6'];
    const parts = [
      el('defs', null, [el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, [
        el('stop', { offset: '0', 'stop-color': grad[0] }),
        el('stop', { offset: '1', 'stop-color': grad[1] }),
      ])]),
      el('rect', { x: -200, y: -200, width: 1680, height: 1120, fill: `url(#${id})` }),
    ];
    let seed = theme.length * 97;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    if (theme === 'cake' || theme === 'menu') {
      const colors = [C.pinkDeep, C.sky, C.mint, C.lemon, C.lilac];
      for (let i = 0; i < 46; i++) {
        parts.push(el('rect', { x: rnd() * 1280, y: rnd() * 720, width: 22, height: 8, rx: 4, fill: colors[i % colors.length], opacity: 0.5, transform: `rotate(${rnd() * 180})`, 'transform-origin': 'center', style: 'transform-box: fill-box' }));
      }
      if (theme === 'cake') parts.push(g({ transform: 'translate(1110 150)' }, [cloud(0.9)]), g({ transform: 'translate(180 230)' }, [cloud(0.7)]));
    } else if (theme === 'garden') {
      parts.push(g({ transform: 'translate(1090 140)' }, [cloud(1)]), g({ transform: 'translate(230 200)' }, [cloud(0.75)]));
      const colors = [C.pink, C.lilac, C.sky, '#fff'];
      // Flowers only in the corners, away from the bins and their labels.
      [[50, 690], [150, 705], [1130, 705], [1230, 688]].forEach(([x, y], i) => parts.push(g({ transform: `translate(${x} ${y})` }, [flower(colors[i % colors.length], 0.85)])));
    } else if (theme === 'beach') {
      parts.push(g({ transform: 'translate(1140 120)' }, [
        el('circle', { r: 58, fill: C.lemon, ...STROKE }),
        g({ transform: 'translate(0 6) scale(0.9)' }, [face('joy')]),
      ]));
      parts.push(g({ transform: 'translate(200 190)' }, [cloud(0.8)]));
      parts.push(el('path', { d: 'M-20 680 q60 -30 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 V760 H-20 Z', fill: C.sky, opacity: 0.7, stroke: C.ink, 'stroke-width': 4 }));
    } else if (theme === 'city') {
      const colors = [C.lilac, C.pink, C.sky, C.peach, C.mint];
      for (let i = 0; i < 12; i++) {
        const w = 80 + rnd() * 40;
        const h = 120 + rnd() * 160;
        const x = i * 112 - 20;
        const bld = [el('rect', { x, y: 720 - h, width: w, height: h + 20, rx: 14, fill: colors[i % colors.length], opacity: 0.55, stroke: C.ink, 'stroke-width': 3 })];
        for (let wy = 720 - h + 22; wy < 690; wy += 38) bld.push(el('rect', { x: x + 18, y: wy, width: 16, height: 18, rx: 4, fill: '#fff', opacity: 0.7 }), el('rect', { x: x + w - 34, y: wy, width: 16, height: 18, rx: 4, fill: '#fff', opacity: 0.7 }));
        parts.push(g(null, bld));
      }
      parts.push(g({ transform: 'translate(1100 140)' }, [cloud(0.8)]));
    } else if (theme === 'space') {
      for (let i = 0; i < 70; i++) parts.push(el('circle', { cx: rnd() * 1280, cy: rnd() * 720, r: 1 + rnd() * 2.5, fill: '#fff', opacity: 0.4 + rnd() * 0.6 }));
      parts.push(g({ transform: 'translate(1130 150)' }, [
        el('ellipse', { rx: 92, ry: 20, fill: 'none', stroke: C.lemon, 'stroke-width': 8, transform: 'rotate(-15)' }),
        el('circle', { r: 50, fill: C.peach, ...STROKE }),
        g({ transform: 'translate(0 4) scale(0.8)' }, [face('happy')]),
      ]));
      parts.push(g({ transform: 'translate(150 190)' }, [el('circle', { r: 30, fill: C.mint, ...STROKE }), g({ transform: 'scale(0.5)' }, [face('wink')])]));
    }
    return g({ class: 'background' }, parts);
  }

  function padlock() {
    return g({ class: 'padlock' }, [
      el('path', { d: 'M-12 -4 V-14 A12 12 0 0 1 12 -14 V-4', fill: 'none', ...STROKE, 'stroke-width': 6 }),
      el('rect', { x: -19, y: -6, width: 38, height: 30, rx: 9, fill: C.lemon, ...STROKE, 'stroke-width': 4 }),
      el('circle', { cx: 0, cy: 7, r: 4, fill: C.ink }),
    ]);
  }

  // Icon for a game mode, used on the level buttons.
  function modeIcon(mode) {
    if (mode === 'pop') return g(null, [el('circle', { r: 14, fill: C.sky, ...STROKE, 'stroke-width': 3 }), el('circle', { cx: -5, cy: -5, r: 3, fill: '#fff' })]);
    if (mode === 'sort') return g(null, [el('path', { d: 'M-14 -10 H14 L10 14 H-10 Z', fill: C.mint, ...STROKE, 'stroke-width': 3 })]);
    if (mode === 'tilde') return el('path', { d: 'M-6 10 L8 -12', ...STROKE, 'stroke-width': 8 });
    return el('path', { d: 'M4 -16 L-10 3 H1 L-4 16 L11 -4 H0 Z', fill: C.lemon, ...STROKE, 'stroke-width': 3 });
  }

  (root.CE = root.CE || {}).sprites = { C, CLASS_COLOR, face, wordBox, bubble, stressDots, bin, heart, star, tildi, belt, button, cloud, flower, background, modeIcon, padlock };
})(window);
