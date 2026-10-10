// Turns keyboard, mouse and touch into abstract actions for the game:
//   { type: 'key', key: 'left'|'right'|'up'|'down'|'ok'|'pause'|'mute'|'other' }
//   { type: 'digit', n }
//   { type: 'tap', act, arg }   (pointer on an element with data-act / data-arg)
//   { type: 'tapAny' }          (pointer anywhere else)
(function (root) {
  const KEYS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    Enter: 'ok', ' ': 'ok', Spacebar: 'ok',
    p: 'pause', P: 'pause', Escape: 'pause',
    m: 'mute', M: 'mute',
  };

  let handler = () => {};
  const queue = [];

  function emit(action) {
    queue.push(action);
  }

  function init(stage, onFirstGesture) {
    let unlocked = false;
    const gesture = () => {
      if (!unlocked) {
        unlocked = true;
        onFirstGesture();
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      gesture();
      if (/^[0-9]$/.test(e.key)) {
        emit({ type: 'digit', n: Number(e.key) });
      } else {
        emit({ type: 'key', key: KEYS[e.key] || 'other' });
      }
      if (KEYS[e.key] || /^[0-9]$/.test(e.key)) e.preventDefault();
    });

    stage.addEventListener('pointerdown', (e) => {
      gesture();
      const target = e.target.closest && e.target.closest('[data-act]');
      if (target) emit({ type: 'tap', act: target.getAttribute('data-act'), arg: target.getAttribute('data-arg') });
      else emit({ type: 'tapAny' });
      e.preventDefault();
    });

    stage.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Delivered once per frame by the main loop so the game handles input in a predictable order.
  function flush() {
    while (queue.length) handler(queue.shift());
  }

  function onAction(fn) {
    handler = fn;
  }

  (root.CE = root.CE || {}).input = { init, flush, onAction, emit };
})(window);
