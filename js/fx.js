// Lightweight effects on their own SVG layer: confetti, sparkles, floating texts, tweens and screen shake.
(function (root) {
  const { el, g, translate } = root.CE.svg;
  const { C } = root.CE.sprites;

  const COLORS = [C.pinkDeep, C.sky, C.mint, C.lemon, C.lilac, C.peach];
  let layer = null;
  let shakeNode = null;
  let items = [];
  let shakeTime = 0;
  let shakePower = 0;

  function init(fxLayer, shakeTarget) {
    layer = fxLayer;
    shakeNode = shakeTarget;
  }

  function add(node, update, life) {
    layer.appendChild(node);
    items.push({ node, update, life, t: 0 });
  }

  function confetti(x, y, n, spread) {
    for (let i = 0; i < (n || 26); i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 200 + Math.random() * (spread || 380);
      let vx = Math.cos(a) * v;
      let vy = Math.sin(a) * v - 260;
      let px = x;
      let py = y;
      const rot = Math.random() * 360;
      const node = i % 3 === 0
        ? el('circle', { r: 7, fill: COLORS[i % COLORS.length], stroke: C.ink, 'stroke-width': 2 })
        : el('rect', { x: -9, y: -4, width: 18, height: 8, rx: 4, fill: COLORS[i % COLORS.length], stroke: C.ink, 'stroke-width': 2 });
      add(node, (it, dt) => {
        vy += 900 * dt;
        vx *= 0.99;
        px += vx * dt;
        py += vy * dt;
        translate(node, px, py, 1, rot + it.t * 400);
        node.setAttribute('opacity', Math.max(0, 1 - it.t / it.life));
      }, 1.3 + Math.random() * 0.5);
    }
  }

  function sparkle(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const node = el('path', { d: 'M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z', fill: color || C.lemon, stroke: C.ink, 'stroke-width': 2 });
      add(node, (it) => {
        const k = it.t / it.life;
        const r = 30 + k * 70;
        translate(node, x + Math.cos(a) * r, y + Math.sin(a) * r, 1.2 - k);
        node.setAttribute('opacity', 1 - k);
      }, 0.6);
    }
  }

  function floatText(x, y, text, color, size) {
    const node = el('text', { class: 'float-text', 'text-anchor': 'middle', fill: color || C.pinkDeep, style: `font-size:${size || 44}px` }, text);
    add(node, (it) => {
      const k = it.t / it.life;
      translate(node, x, y - k * 90, 1 + Math.sin(Math.min(1, k * 4) * Math.PI) * 0.15);
      node.setAttribute('opacity', k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3);
    }, 1.1);
  }

  // Move an existing node along a curve from (x0,y0) to (x1,y1), shrinking it; then call done.
  function fly(node, x0, y0, x1, y1, dur, done) {
    const parent = node.parentNode;
    add(node, (it) => {
      const k = Math.min(1, it.t / it.life);
      const e = k * k * (3 - 2 * k);
      const x = x0 + (x1 - x0) * e;
      const y = y0 + (y1 - y0) * e - Math.sin(e * Math.PI) * 120;
      translate(node, x, y, 1 - e * 0.75, e * 20);
      if (k >= 1 && done) {
        done();
        done = null;
      }
    }, dur || 0.45);
    if (parent && parent !== layer) parent.removeChild(node);
  }

  function shake(power, time) {
    shakePower = power || 10;
    shakeTime = time || 0.3;
  }

  function update(dt) {
    for (const it of items) {
      it.t += dt;
      it.update(it, dt);
    }
    items = items.filter((it) => {
      if (it.t < it.life) return true;
      if (it.node.parentNode) it.node.parentNode.removeChild(it.node);
      return false;
    });
    if (shakeNode) {
      if (shakeTime > 0) {
        shakeTime -= dt;
        const p = shakePower * Math.max(0, shakeTime) * 3;
        shakeNode.setAttribute('transform', `translate(${(Math.random() - 0.5) * p} ${(Math.random() - 0.5) * p})`);
      } else {
        shakeNode.removeAttribute('transform');
      }
    }
  }

  function reset() {
    for (const it of items) if (it.node.parentNode) it.node.parentNode.removeChild(it.node);
    items = [];
  }

  (root.CE = root.CE || {}).fx = { init, confetti, sparkle, floatText, fly, shake, update, reset };
})(window);
