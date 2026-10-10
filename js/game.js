// Game state machine: menu → intro → play ⇄ hint / paused → clear | gameover → … → victory.
(function (root) {
  const CE = root.CE;
  const { el, g, clear, translate, textWidth, wrap } = CE.svg;
  const SP = CE.sprites;
  const { C } = SP;
  const { LEVELS, MODE_INFO } = CE.levels;
  const D = CE.deck;
  const audio = CE.audio;
  const fx = CE.fx;

  const BELT_X1 = 40;
  const BELT_X2 = 1240;
  const BELT_Y = 392;
  const HEARTS = 5;
  const TILDI = { x: 104, y: 600, s: 0.8 };
  const PRAISE = ['¡Bien!', '¡Genial!', '¡Súper!', '¡Toma ya!', '¡Eso es!', '¡Bravo!'];

  const MODE_HELP = {
    pop: ['Las palabras llegan partidas en sílabas.', 'Explota la sílaba que suena más fuerte: la tónica.'],
    sort: ['Mira dónde está la sílaba tónica y manda la palabra a su cubo.', 'Aguda: la última · Llana: la penúltima · Esdrújula: la antepenúltima.'],
    tilde: ['Las palabras llegan sin tildes.', 'Pon la tilde en la vocal correcta… o pulsa SIN TILDE si no lleva.'],
    express: ['¡Todo mezclado!', 'Cada palabra trae su reto: sílaba tónica, cubo o tilde.'],
  };

  const ST = CE.storage;

  const game = {
    state: 'boot',
    progress: ST.load(),
    menuSel: 0,
    levelIdx: 0,
    runScore: 0,
    timers: [],
    clock: 0,
    debug: {},

    init(layers, debug) {
      this.L = layers;
      this.debug = debug || {};
      this.rng = D.makeRng(this.debug.seed !== undefined ? this.debug.seed : Date.now() % 100000);
      CE.input.onAction((a) => this.onAction(a));
      fx.init(layers.fx, layers.world);
    },

    after(sec, fn) {
      this.timers.push({ at: this.clock + sec, fn });
    },

    // ---------- shared drawing ----------

    setBackground(theme) {
      clear(this.L.bg).appendChild(SP.background(theme));
    },

    resetLayers() {
      fx.reset();
      for (const k of ['scene', 'fixed', 'carriers', 'hud', 'overlay']) clear(this.L[k]);
      this.timers = [];
      this.carrier = null;
      this.mode = null;
    },

    title(x, y, size, text, fill) {
      return el('text', { x, y, class: 'title', 'text-anchor': 'middle', fill: fill || C.pinkDeep, style: `font-size:${size}px` }, text);
    },

    label(x, y, size, text, extra) {
      return el('text', Object.assign({ x, y, class: 'label', 'text-anchor': 'middle', style: `font-size:${size}px` }, extra || {}), text);
    },

    panel(x, y, w, h, fill) {
      return el('rect', { x, y, width: w, height: h, rx: 36, fill: fill || C.white, stroke: C.ink, 'stroke-width': 6, class: 'panel' });
    },

    // Overlay card with buttons, navigable with ← → / Enter or by tapping.
    showCard(title, bodyNodes, buttons, opts) {
      opts = opts || {};
      const h = opts.height || 460;
      const y = (720 - h) / 2;
      const ov = clear(this.L.overlay);
      ov.appendChild(el('rect', { x: -200, y: -200, width: 1680, height: 1120, fill: C.ink, opacity: 0.35 }));
      ov.appendChild(this.panel(170, y, 940, h));
      if (title) ov.appendChild(this.title(640, y + 92, opts.titleSize || 64, title));
      bodyNodes.forEach((n) => ov.appendChild(n));
      this.cardButtons = buttons;
      this.cardSel = opts.selected !== undefined ? opts.selected : buttons.length - 1;
      const bw = 250;
      const total = buttons.length * bw + (buttons.length - 1) * 30;
      buttons.forEach((b, i) => {
        const bx = 640 - total / 2 + bw / 2 + i * (bw + 30);
        const node = g({ transform: `translate(${bx} ${y + h - 70})`, 'data-act': 'card', 'data-arg': i, class: 'tappable' }, [SP.button(b.label, bw, 78, b.color || C.pink, { size: 34 })]);
        b.node = node;
        ov.appendChild(node);
      });
      this.highlightCard();
    },

    highlightCard() {
      (this.cardButtons || []).forEach((b, i) => b.node && b.node.querySelector('.button').classList.toggle('selected', i === this.cardSel));
    },

    cardInput(a) {
      if (!this.cardButtons || !this.cardButtons.length) return;
      if (a.type === 'key' && (a.key === 'left' || a.key === 'right')) {
        const n = this.cardButtons.length;
        this.cardSel = (this.cardSel + (a.key === 'left' ? n - 1 : 1)) % n;
        this.highlightCard();
        audio.play('move');
      } else if (a.type === 'key' && a.key === 'ok') {
        this.cardAction(this.cardButtons[this.cardSel].act);
      } else if (a.type === 'tap' && a.act === 'card') {
        this.cardAction(this.cardButtons[Number(a.arg)].act);
      }
    },

    cardAction(act) {
      audio.play('click');
      if (act === 'menu') this.showMenu();
      else if (act === 'retry') this.startLevel(this.levelIdx, true);
      else if (act === 'next') {
        const next = this.levelIdx === LEVELS.length - 1 ? null : ST.nextLevel(this.progress, this.level.n);
        if (this.levelIdx === LEVELS.length - 1) this.showVictory();
        else if (next) this.startLevel(next - 1);
        else this.showMenu();
      }
      else if (act === 'resume') this.resume();
      else if (act === 'start') this.beginPlay();
    },

    // ---------- menu ----------

    showMenu() {
      this.state = 'menu';
      this.resetLayers();
      this.setBackground('menu');
      const s = this.L.scene;
      s.appendChild(g({ transform: 'translate(250 92) rotate(-4)' }, [this.title(0, 0, 84, 'Clasifica')]));
      s.appendChild(g({ transform: 'translate(250 150) rotate(-4)' }, [
        el('rect', { x: -130, y: -36, width: 260, height: 58, rx: 29, fill: C.lemon, stroke: C.ink, 'stroke-width': 5 }),
        this.title(0, 8, 46, 'EXPRESS', C.ink),
      ]));
      s.appendChild(g({ transform: 'translate(110 330) scale(0.95)' }, [SP.tildi('joy')]));
      s.appendChild(this.label(250, 230, 26, 'Agudas · llanas · esdrújulas'));
      s.appendChild(this.label(250, 262, 26, '¡y tildes!'));
      s.appendChild(this.label(250, 460, 24, `Récord: ${this.progress.best}`, { class: 'label strong' }));
      this.menuStatus = this.label(250, 498, 22, '');
      s.appendChild(this.menuStatus);
      s.appendChild(this.label(250, 540, 20, 'Flechas + Enter, ratón o toca', { class: 'label soft' }));
      s.appendChild(this.label(250, 568, 20, 'M: sonido · P: pausa', { class: 'label soft' }));

      this.levelNodes = [];
      CE.levels.WORLDS.forEach((world, wi) => {
        const y = 82 + wi * 128;
        s.appendChild(el('text', { x: 615, y: y + 10, class: 'world-name', 'text-anchor': 'end' }, `${wi + 1} · ${world.name}`));
        for (let m = 0; m < 4; m++) {
          const lv = LEVELS[wi * 4 + m];
          const x = 705 + m * 150;
          const stars = ST.levelInfo(this.progress, lv.n).stars;
          const open = this.unlocked(lv.n);
          const node = g({ transform: `translate(${x} ${y})`, 'data-act': 'level', 'data-arg': lv.n - 1, class: 'tappable level-button' + (open ? '' : ' locked') }, [
            el('rect', { x: -72, y: -56, width: 144, height: 112, rx: 30, class: 'focus-ring' }),
            el('rect', { x: -64, y: -42, width: 128, height: 96, rx: 26, fill: C.ink, opacity: 0.2 }),
            el('rect', { x: -64, y: -48, width: 128, height: 96, rx: 26, fill: open ? [C.pink, C.mint, C.sky, C.lilac, C.peach][wi] : C.grey, stroke: C.ink, 'stroke-width': 5 }),
            el('text', { x: -14, y: 2, class: 'level-number', 'text-anchor': 'middle', opacity: open ? 1 : 0.45 }, String(lv.n)),
            g({ transform: 'translate(36 -14) scale(0.9)' }, [open ? SP.modeIcon(lv.mode) : SP.padlock()]),
            open ? g({ transform: 'translate(0 30)' }, [0, 1, 2].map((i) => g({ transform: `translate(${(i - 1) * 30} 0)` }, [SP.star(i < stars, 12)]))) : null,
          ]);
          this.levelNodes.push(node);
          s.appendChild(node);
        }
      });
      this.highlightMenu();
    },

    unlocked(n) {
      return !!this.debug.all || ST.isUnlocked(this.progress, n);
    },

    // First open level not cleared yet (or the last open one), where the menu cursor starts.
    firstOpenLevel() {
      const done = ST.cleared(this.progress);
      const open = LEVELS.filter((l) => this.unlocked(l.n));
      const todo = open.find((l) => !done.has(l.n));
      return (todo || open[open.length - 1]).n - 1;
    },

    highlightMenu() {
      this.levelNodes.forEach((n, i) => n.classList.toggle('selected', i === this.menuSel));
      const lv = LEVELS[this.menuSel];
      const info = ST.levelInfo(this.progress, lv.n);
      this.menuStatus.textContent = this.unlocked(lv.n)
        ? `Nivel ${lv.n} · ${MODE_INFO[lv.mode].title}` + (info.best ? ` · mejor: ${info.best}` : '')
        : `Bloqueado · ${CE.levels.requirementText(lv.n, ST.cleared(this.progress))}`;
    },

    tryStart(idx) {
      if (this.unlocked(idx + 1)) return this.startLevel(idx);
      audio.play('bad');
      const node = this.levelNodes[idx];
      node.classList.remove('wrong');
      node.getBoundingClientRect();
      node.classList.add('wrong');
    },

    menuInput(a) {
      if (a.type === 'key') {
        const d = { left: -1, right: 1, up: -4, down: 4 }[a.key];
        if (d) {
          this.menuSel = (this.menuSel + d + 20) % 20;
          this.highlightMenu();
          audio.play('move');
        } else if (a.key === 'ok') {
          this.tryStart(this.menuSel);
        }
      } else if (a.type === 'tap' && a.act === 'level') {
        this.menuSel = Number(a.arg);
        this.highlightMenu();
        this.tryStart(this.menuSel);
      }
    },

    // ---------- level flow ----------

    startLevel(idx, retry) {
      audio.play('click');
      if (idx >= LEVELS.length) return this.showVictory();
      if (!retry && this.state === 'menu') this.runScore = 0;
      if (retry) this.runScore = this.levelStartScore;
      this.levelIdx = idx;
      this.menuSel = idx;
      const base = LEVELS[idx];
      this.level = Object.assign({}, base);
      if (this.debug.mode) this.level.mode = this.debug.mode;
      if (this.debug.egg) this.level.eggChance = 1;
      this.levelStartScore = this.runScore;
      this.deck = new D.Deck(this.level, this.rng);
      this.combo = new D.Combo(this.level.maxSpeed);
      this.hearts = HEARTS;
      this.state = 'intro';
      this.resetLayers();
      this.setBackground(this.level.theme);
      this.drawScene();
      this.renderHud();
      const info = MODE_INFO[this.level.mode];
      const body = [
        this.label(640, 250, 30, `Nivel ${this.level.n} · ${this.level.worldName}`, { class: 'label soft' }),
        this.label(640, 330, 50, info.task, { class: 'label strong' }),
        ...MODE_HELP[this.level.mode].map((t, i) => this.label(640, 410 + i * 42, 28, t)),
        this.label(640, 500, 24, `Consigue ${this.level.goal} aciertos para pasar de nivel.`, { class: 'label soft' }),
      ];
      this.showCard(info.title, body, [{ label: '¡Empezar!', act: 'start', color: C.mint }], { height: 540 });
    },

    drawScene() {
      const s = this.L.scene;
      const belt = SP.belt(BELT_X1, BELT_X2, BELT_Y);
      this.beltStripes = belt.stripes;
      this.beltOffset = 0;
      s.appendChild(belt);
      this.tildiNode = g({ transform: `translate(${TILDI.x} ${TILDI.y}) scale(${TILDI.s})` });
      s.appendChild(this.tildiNode);
      this.setTildi('happy');
    },

    setTildi(mood) {
      if (!this.tildiNode) return;
      clear(this.tildiNode).appendChild(SP.tildi(mood));
      this.tildiNode.classList.remove('bounce');
      this.tildiNode.getBoundingClientRect(); // restart the CSS animation
      this.tildiNode.classList.add('bounce');
    },

    beginPlay() {
      clear(this.L.overlay);
      this.cardButtons = null;
      this.state = 'play';
      audio.startMusic();
      this.spawn();
    },

    spawn() {
      clear(this.L.carriers);
      clear(this.L.fixed);
      this.task = this.deck.next();
      this.mode = CE.modes[this.task.mode].build(this.task);
      this.carrier = this.mode.carrier;
      this.carrierY = BELT_Y - this.mode.height / 2 - 18;
      this.carrierX = BELT_X1 + this.mode.width / 2 + 10;
      this.endX = BELT_X2 - this.mode.width / 2 + 30;
      translate(this.carrier, this.carrierX, this.carrierY);
      this.L.carriers.appendChild(this.carrier);
      if (this.mode.fixed) this.L.fixed.appendChild(this.mode.fixed);
      this.resolving = false;
      this.spawnedAt = this.clock;
      this.setTildi(this.task.egg ? 'wow' : 'happy');
      if (this.task.egg) {
        audio.play('egg');
        fx.floatText(980, 300, '¡Palabra dorada!', C.gold, 48);
      }
      this.renderHud();
    },

    speed() {
      const dist = BELT_X2 - BELT_X1 - this.mode.width;
      return dist / (this.level.travel / this.combo.speed);
    },

    worldPoint(local) {
      return { x: this.carrierX + (local ? local.x : 0), y: this.carrierY + (local ? local.y : 0) };
    },

    resolve(choice) {
      if (this.resolving) return;
      this.resolving = true;
      const task = this.task;
      const ok = D.isCorrect(task, choice);
      this.deck.answer(task, ok);
      this.mode.celebrate(ok, choice);
      const local = this.mode.pointOf ? this.mode.pointOf(choice) : null;
      const at = local ? this.worldPoint(local) : (this.mode.fixedPoint || this.worldPoint());
      if (ok) {
        const before = this.combo.multiplier;
        const pts = this.combo.hit(task.egg ? 1000 : 100);
        audio.play(task.egg ? 'egg' : { pop: 'pop', sort: 'drop', tilde: 'good' }[task.mode]);
        if (task.mode === 'sort') {
          const t = this.mode.target(choice);
          fx.fly(this.carrier, this.carrierX, this.carrierY, t.x, t.y, 0.45, () => fx.sparkle(t.x, t.y - 30));
          this.carrier = null;
          fx.floatText(t.x, t.y - 120, `+${pts}`, C.pinkDeep, 44);
        } else {
          fx.sparkle(at.x, at.y);
          fx.floatText(at.x, at.y - 90, `+${pts}`, C.pinkDeep, 44);
        }
        if (task.egg) fx.confetti(640, 300, 60);
        if (this.combo.multiplier > before) {
          audio.play('combo');
          fx.floatText(640, 230, `¡COMBO ×${this.combo.multiplier}!`, C.lilac, 60);
          fx.confetti(640, 230, 30);
        } else if (Math.random() < 0.35) {
          fx.floatText(TILDI.x + 60, TILDI.y - 110, PRAISE[Math.floor(Math.random() * PRAISE.length)], C.ink, 30);
        }
        this.setTildi('joy');
        this.after(0.65, () => (this.deck.done ? this.levelClear() : this.spawn()));
      } else {
        this.combo.miss();
        if (!task.egg) this.hearts--;
        audio.play('bad');
        fx.shake(8, 0.3);
        this.setTildi('sad');
        this.after(0.55, () => this.showHint('wrong'));
      }
      this.renderHud();
    },

    timeout() {
      this.resolving = true;
      const task = this.task;
      this.deck.answer(task, false);
      this.combo.miss();
      if (!task.egg) this.hearts--;
      audio.play('fall');
      fx.fly(this.carrier, this.carrierX, this.carrierY, BELT_X2 + 60, 820, 0.6);
      this.carrier = null;
      this.setTildi('wow');
      this.renderHud();
      this.after(0.7, () => this.showHint('timeout'));
    },

    // After a miss: explain why, then the word comes back later in the level.
    showHint(reason) {
      this.state = 'hint';
      this.hintReadyAt = this.clock + 0.7;
      const ex = D.explain(this.task.word);
      const nodes = [];
      const size = 60;
      const widths = ex.syllables.map((syl) => textWidth(syl, size, 800) + 44);
      const total = widths.reduce((a, b) => a + b, 0) + 14 * (widths.length - 1);
      let x = 640 - total / 2;
      ex.syllables.forEach((syl, i) => {
        const w = widths[i];
        const tonic = i === ex.stress;
        nodes.push(g({ transform: `translate(${x + w / 2} 250)` }, [
          el('rect', { x: -w / 2, y: -44, width: w, height: 88, rx: 44, fill: tonic ? C.pink : C.white, stroke: C.ink, 'stroke-width': tonic ? 6 : 4 }),
          el('text', { x: 0, y: 21, class: 'word-text' + (tonic ? ' tonic' : ''), 'text-anchor': 'middle', style: `font-size:${size}px` }, syl),
          tonic ? el('text', { x: 0, y: -56, class: 'label strong', 'text-anchor': 'middle', style: 'font-size:22px' }, 'tónica') : null,
        ]));
        x += w + 14;
      });
      nodes.push(g({ transform: 'translate(640 335)' }, [
        el('rect', { x: -150, y: -26, width: 300, height: 52, rx: 26, fill: SP.CLASS_COLOR[ex.cls], stroke: C.ink, 'stroke-width': 4 }),
        el('text', { x: -40, y: 11, class: 'label strong', 'text-anchor': 'middle', style: 'font-size:28px' }, CE.syllables.CLASS_LABELS[ex.cls]),
        g({ transform: 'translate(90 0) scale(0.7)' }, [SP.stressDots(ex.cls)]),
      ]));
      let ly = 402;
      for (const line of ex.lines.slice(1)) {
        for (const part of wrap(line, 60)) {
          nodes.push(this.label(660, ly, 28, part));
          ly += 36;
        }
      }
      const again = this.task.egg ? '¡Era una sobresdrújula! No pierdes corazón.' : 'Esta palabra volverá a salir más adelante.';
      nodes.push(this.label(660, Math.max(ly + 10, 515), 22, again, { class: 'label soft' }));
      nodes.push(g({ transform: 'translate(260 560) scale(0.62)' }, [SP.tildi('happy')]));
      this.showCard(reason === 'timeout' ? '¡Se escapó!' : '¡Casi! Fíjate:', nodes, [{ label: 'Seguir', act: 'hintdone', color: C.mint }], { height: 600 });
    },

    hintInput(a) {
      if (this.clock < this.hintReadyAt) return;
      if (a.type === 'key' && (a.key === 'mute' || a.key === 'pause')) return;
      this.dismissHint();
    },

    dismissHint() {
      clear(this.L.overlay);
      this.cardButtons = null;
      if (this.hearts <= 0) return this.gameOver();
      this.state = 'play';
      this.spawn();
    },

    stars() {
      return this.hearts >= 5 ? 3 : this.hearts >= 3 ? 2 : 1;
    },

    levelClear() {
      this.state = 'clear';
      clear(this.L.carriers);
      clear(this.L.fixed);
      this.runScore += this.combo.score;
      const stars = this.stars();
      const n = this.level.n;
      const unlockedNow = ST.recordClear(this.progress, n, stars, this.combo.score, this.runScore);
      ST.save(this.progress);
      audio.play('clear');
      fx.confetti(640, 200, 80, 500);
      this.setTildi('joy');
      this.renderHud();
      const nodes = [
        g({ transform: 'translate(640 300)' }, [0, 1, 2].map((i) => g({ transform: `translate(${(i - 1) * 110} ${i === 1 ? -14 : 0})` }, [SP.star(i < stars, 46)]))),
        this.label(640, 395, 34, `Puntos: ${this.runScore}`, { class: 'label strong' }),
        this.label(640, 440, 26, this.combo.best === 1 ? 'Mejor racha: 1 acierto' : `Mejor racha: ${this.combo.best} aciertos seguidos`),
      ];
      if (unlockedNow.length) {
        const list = unlockedNow.length === 1 ? `el nivel ${unlockedNow[0]}` : `los niveles ${unlockedNow.slice(0, -1).join(', ')} y ${unlockedNow[unlockedNow.length - 1]}`;
        nodes.push(this.label(640, 484, 26, `¡Has desbloqueado ${list}!`, { class: 'label strong unlocked-text' }));
      }
      const last = this.levelIdx === LEVELS.length - 1;
      const buttons = [
        { label: 'Menú', act: 'menu', color: C.white },
        { label: 'Repetir', act: 'retry', color: C.sky },
        { label: last ? '¡Final!' : 'Siguiente', act: 'next', color: C.mint },
      ];
      this.showCard('¡Nivel superado!', nodes, buttons, { height: 540 });
    },

    gameOver() {
      this.state = 'gameover';
      clear(this.L.carriers);
      clear(this.L.fixed);
      ST.recordScore(this.progress, this.runScore + this.combo.score);
      ST.save(this.progress);
      audio.play('gameover');
      this.setTildi('sad');
      const nodes = [
        g({ transform: 'translate(640 315) scale(0.8)' }, [SP.tildi('sad')]),
        this.label(640, 440, 30, 'Te has quedado sin corazones.'),
        this.label(640, 480, 26, '¡Cada error te enseña algo! ¿Otra vez?', { class: 'label soft' }),
      ];
      this.showCard('¡Oh, no!', nodes, [{ label: 'Menú', act: 'menu', color: C.white }, { label: 'Reintentar', act: 'retry', color: C.mint }], { height: 540 });
    },

    showVictory() {
      this.state = 'victory';
      this.resetLayers();
      this.setBackground('space');
      audio.play('clear');
      fx.confetti(640, 200, 120, 600);
      this.after(0.8, () => fx.confetti(320, 260, 60));
      this.after(1.4, () => fx.confetti(960, 260, 60));
      const nodes = [
        g({ transform: 'translate(640 315) scale(0.8)' }, [SP.tildi('joy')]),
        this.label(640, 440, 32, '¡Has superado los 20 niveles!', { class: 'label strong' }),
        this.label(640, 484, 28, `Puntos: ${this.runScore}`),
      ];
      this.showCard('¡Eres un crack de las tildes!', nodes, [{ label: 'Menú', act: 'menu', color: C.mint }], { height: 540, titleSize: 54 });
    },

    pause() {
      if (this.state !== 'play') return;
      this.state = 'paused';
      const nodes = [this.label(640, 300, 30, 'El juego está en pausa.'), g({ transform: 'translate(640 400) scale(0.6)' }, [SP.tildi('wink')])];
      this.showCard('Pausa', nodes, [{ label: 'Menú', act: 'menu', color: C.white }, { label: 'Seguir', act: 'resume', color: C.mint }]);
    },

    resume() {
      clear(this.L.overlay);
      this.cardButtons = null;
      this.state = 'play';
    },

    // ---------- HUD ----------

    renderHud() {
      const h = clear(this.L.hud);
      if (!this.level) return;
      const info = MODE_INFO[this.task && this.state !== 'intro' ? this.task.mode : this.level.mode];
      h.appendChild(el('rect', { x: 18, y: 14, width: 330, height: 58, rx: 29, fill: C.white, stroke: C.ink, 'stroke-width': 4 }));
      h.appendChild(el('text', { x: 183, y: 53, class: 'hud-text', 'text-anchor': 'middle' }, `Nivel ${this.level.n} · ${MODE_INFO[this.level.mode].title}`));
      for (let i = 0; i < HEARTS; i++) h.appendChild(g({ transform: `translate(${520 + i * 56} 46)` }, [SP.heart(i < this.hearts)]));
      h.appendChild(el('rect', { x: 840, y: 14, width: 270, height: 58, rx: 29, fill: C.white, stroke: C.ink, 'stroke-width': 4 }));
      const score = this.runScore + (this.combo && this.state !== 'clear' ? this.combo.score : 0);
      h.appendChild(el('text', { x: this.combo && this.combo.multiplier > 1 ? 940 : 975, y: 53, class: 'hud-text', 'text-anchor': 'middle' }, String(score)));
      if (this.combo && this.combo.multiplier > 1) {
        h.appendChild(g({ transform: 'translate(1062 43)' }, [
          el('rect', { x: -40, y: -22, width: 80, height: 44, rx: 22, fill: C.lilac, stroke: C.ink, 'stroke-width': 4 }),
          el('text', { x: 0, y: 11, class: 'hud-text', 'text-anchor': 'middle' }, `×${this.combo.multiplier}`),
        ]));
      }
      h.appendChild(g({ transform: 'translate(1160 43)', 'data-act': 'mute', class: 'tappable' }, [
        el('circle', { r: 30, fill: C.white, stroke: C.ink, 'stroke-width': 4 }),
        el('path', { d: 'M-14 -6 H-6 L4 -15 V15 L-6 6 H-14 Z', fill: C.ink }),
        audio.isMuted() ? el('path', { d: 'M8 -8 L18 8 M18 -8 L8 8', stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }) : el('path', { d: 'M9 -8 Q15 0 9 8', fill: 'none', stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }),
      ]));
      h.appendChild(g({ transform: 'translate(1232 43)', 'data-act': 'pause', class: 'tappable' }, [
        el('circle', { r: 30, fill: C.white, stroke: C.ink, 'stroke-width': 4 }),
        el('rect', { x: -10, y: -12, width: 7, height: 24, rx: 3, fill: C.ink }),
        el('rect', { x: 3, y: -12, width: 7, height: 24, rx: 3, fill: C.ink }),
      ]));
      // Progress towards the goal (the bar only fills with first-time correct answers; retries block the end).
      const p = this.deck ? this.deck.progress : 0;
      h.appendChild(el('rect', { x: 340, y: 88, width: 600, height: 20, rx: 10, fill: C.white, stroke: C.ink, 'stroke-width': 3 }));
      if (p > 0) h.appendChild(el('rect', { x: 342, y: 90, width: Math.max(16, 596 * p), height: 16, rx: 8, fill: C.pinkDeep }));
      const pending = this.deck ? this.deck.retries.length + (this.deck.retryOut ? 1 : 0) : 0;
      h.appendChild(el('text', { x: 956, y: 106, class: 'hud-small' }, `${this.deck ? Math.min(this.deck.correct, this.level.goal) : 0}/${this.level.goal}` + (pending ? `  ·  repasos: ${pending}` : '')));
      if (this.state === 'play' || this.state === 'hint' || this.state === 'paused') {
        h.appendChild(el('rect', { x: 640 - 300, y: 122, width: 600, height: 50, rx: 25, fill: C.white, opacity: 0.85, stroke: C.ink, 'stroke-width': 3 }));
        h.appendChild(el('text', { x: 640, y: 157, class: 'prompt', 'text-anchor': 'middle' }, info.task));
        if (this.mode && this.mode.keysHelp) {
          h.appendChild(el('rect', { x: 660 - 330, y: 682, width: 660, height: 34, rx: 17, fill: C.white, opacity: 0.85 }));
          h.appendChild(el('text', { x: 660, y: 706, class: 'hud-small help', 'text-anchor': 'middle' }, this.mode.keysHelp));
        }
      }
    },

    // ---------- input & loop ----------

    onAction(a) {
      if (a.type === 'key' && a.key === 'mute') {
        audio.toggleMute();
        return this.renderHud();
      }
      if (a.type === 'tap' && a.act === 'mute') {
        audio.toggleMute();
        return this.renderHud();
      }
      switch (this.state) {
        case 'menu': return this.menuInput(a);
        case 'intro':
          if (a.type === 'key' && a.key === 'pause') return this.showMenu();
          if (a.type === 'key' && a.key !== 'ok' && a.key !== 'other') return;
          return this.beginPlay();
        case 'play':
          if ((a.type === 'key' && a.key === 'pause') || (a.type === 'tap' && a.act === 'pause')) return this.pause();
          if (this.resolving || !this.mode) return;
          {
            const r = this.mode.handle(a);
            if (!r) return;
            if (r.moved) audio.play('move');
            if (r.choice !== undefined) this.resolve(r.choice);
          }
          return;
        case 'hint': return this.hintInput(a);
        case 'paused':
          if (a.type === 'key' && a.key === 'pause') return this.resume();
          return this.cardInput(a);
        case 'clear':
        case 'gameover':
        case 'victory':
          return this.cardInput(a);
        default:
      }
    },

    update(dt) {
      this.clock += dt;
      document.body.dataset.state = `${this.state}:${this.level ? this.level.n : 0}:${this.runScore}`;
      const due = this.timers.filter((t) => t.at <= this.clock);
      this.timers = this.timers.filter((t) => t.at > this.clock);
      due.forEach((t) => t.fn());
      if (this.state === 'play' && this.mode && !this.resolving && this.carrier) {
        const v = this.speed();
        this.carrierX += v * dt;
        this.beltOffset -= v * dt;
        this.beltStripes.setAttribute('stroke-dashoffset', this.beltOffset.toFixed(1));
        translate(this.carrier, this.carrierX, this.carrierY);
        if (this.carrierX >= this.endX) this.timeout();
      }
      if (this.debug.auto) this.autoplay();
      fx.update(dt);
      audio.schedule();
    },

    // Debug bot (?auto=1): answers correctly; ?auto=miss answers wrong every 7th word.
    autoplay() {
      const wait = 0.8;
      if (this.state === 'intro' && this.clock > 0.5) this.beginPlay();
      else if (this.state === 'play' && !this.resolving && this.mode && this.clock - this.spawnedAt > wait) {
        const right = this.mode.correctChoice();
        const wrong = this.task.mode === 'sort' ? (right === 'aguda' ? 'llana' : 'aguda') : this.task.mode === 'pop' ? (right + 1) % this.task.options.length : (right === -1 ? this.task.slots[0] : -1);
        this.resolve(this.debug.auto === 'miss' && this.deck.served % 7 === 0 ? wrong : right);
      } else if (this.state === 'hint' && this.clock > this.hintReadyAt + 0.3) this.dismissHint();
      else if (this.state === 'clear' && this.timers.length === 0 && !this.autoNext) {
        this.autoNext = true;
        this.after(1, () => { this.autoNext = false; if (this.state === 'clear') this.startLevel(this.levelIdx + 1); });
      }
    },

    // Jump straight to a screen for screenshots: ?screen=menu|intro|play|hint|pause|clear|gameover|victory
    debugScreen(screen) {
      if (screen === 'menu' || !screen) return;
      if (screen === 'victory') return this.showVictory();
      this.state = 'menu';
      this.startLevel(this.menuSel);
      if (screen === 'intro') return;
      this.beginPlay();
      this.carrierX += (this.endX - this.carrierX) * 0.3;
      translate(this.carrier, this.carrierX, this.carrierY);
      if (screen === 'hint') {
        this.hearts = 3;
        this.renderHud();
        this.showHint('wrong');
      } else if (screen === 'pause') this.pause();
      else if (screen === 'clear') {
        this.deck.correct = this.level.goal;
        this.hearts = 4;
        this.combo.hit();
        this.levelClear();
      } else if (screen === 'gameover') {
        this.hearts = 0;
        this.renderHud();
        this.gameOver();
      }
    },
  };

  CE.game = game;
})(window);
