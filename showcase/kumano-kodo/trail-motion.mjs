/**
 * A tiny enhancement layer for the Kumano roadbook.
 *
 * It has no data dependencies: the roadbook remains fully readable if this
 * module is omitted or fails to load.  Call `initTrailMotion()` only after
 * app.js has rendered the page.
 */

let currentCleanup = null;

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const animate = (node, keyframes, options) => {
  if (!node?.animate || reduceMotion()) return null;
  return node.animate(keyframes, { easing: 'cubic-bezier(.22,.7,.25,1)', ...options });
};

const number = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Progressively enhances a rendered roadbook.
 * @param {Document|HTMLElement} root
 * @returns {() => void} removes listeners, observers, and in-flight motion
 */
export function initTrailMotion(root = document) {
  currentCleanup?.();
  const scope = root.querySelectorAll ? root : document;
  const cleanups = [];
  const animations = new Set();
  const pressAnimations = new WeakMap();
  const play = (node, frames, options) => {
    const running = animate(node, frames, options);
    if (!running) return null;
    animations.add(running);
    running.finished.catch(() => {}).finally(() => animations.delete(running));
    return running;
  };
  const listen = (node, type, handler, options) => {
    node.addEventListener(type, handler, options);
    cleanups.push(() => node.removeEventListener(type, handler, options));
  };

  // Days keep native <details> semantics.  The animation deliberately happens
  // after its state changes, so screen readers and quick repeated taps retain
  // the browser's correct open/closed state.
  scope.querySelectorAll('details.day').forEach(day => {
    let lastAnimation = null;
    const content = day.querySelector(':scope > .day-content');
    if (!content) return;
    const summary = day.querySelector(':scope > summary');
    let fold = null;
    let desiredOpen = day.open;
    if (summary) listen(summary, 'click', event => {
      if (reduceMotion()) return;
      if (!fold) desiredOpen = day.open;
      event.preventDefault();
      const from = day.open ? content.getBoundingClientRect().height : 0;
      desiredOpen = !desiredOpen;
      fold?.cancel();
      day.open = true;
      const to = desiredOpen ? content.scrollHeight : 0;
      const current = play(content, [{ height: from + 'px' }, { height: to + 'px' }], {
        duration: Math.min(560, 280 + Math.abs(to-from) * .06),
        easing: 'cubic-bezier(.22,.65,.25,1)',
        fill: 'none',
      });
      fold = current;
      current?.finished.then(() => {
        if (fold !== current) return;
        day.open = desiredOpen;
        fold = null;
      }).catch(() => {});
    });
    listen(day, 'toggle', () => {
      lastAnimation?.cancel();
      if (!day.open || reduceMotion()) return;
      const children = [...content.children].filter(child => !child.matches('.day-stay'));
      lastAnimation = play(content, [
        { opacity: 0.35, transform: 'translateY(-7px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 260, fill: 'both' });
      children.forEach((child, index) => {
        play(child, [
          { opacity: 0, transform: 'translateY(9px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 240, delay: Math.min(index * 38, 190), fill: 'both' });
      });
    });
  });

  // Reading sections are visible by default. IntersectionObserver only adds a
  // single, subtle arrival cue; it never hides content or controls scrolling.
  if (!reduceMotion() && 'IntersectionObserver' in window) {
    const arrived = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || arrived.has(entry.target)) return;
        arrived.add(entry.target);
        play(entry.target, [
          { opacity: 0.72, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 360, fill: 'both' });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    scope.querySelectorAll('.section, .event, .ticket-box').forEach(node => observer.observe(node));
    cleanups.push(() => observer.disconnect());
  }

  // A short pressed state makes links, chips and ticket controls feel tactile
  // without adding an always-running animation.
  const pressSelector = 'button, .place-chip, .ticket-check, .transport-tab, .prep-filter, .dot-button';
  const releasePress = event => {
    const target = event.target.closest?.('[data-trail-pressed]');
    if (!target) return;
    pressAnimations.get(target)?.cancel();
    pressAnimations.delete(target);
    target.removeAttribute('data-trail-pressed');
    play(target, [{ transform: 'scale(.975)' }, { transform: 'scale(1)' }], { duration: 105 });
  };
  listen(scope, 'pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target.closest?.(pressSelector);
    if (!target || target.disabled) return;
    target.setAttribute('data-trail-pressed', '');
    pressAnimations.get(target)?.cancel();
    const pressed = play(target, [{ transform: 'scale(1)' }, { transform: 'scale(.975)' }], { duration: 90, fill: 'forwards' });
    if (pressed) pressAnimations.set(target, pressed);
  });
  listen(scope, 'pointerup', releasePress);
  listen(scope, 'pointercancel', releasePress);
  listen(scope, 'pointerleave', releasePress, true);
  listen(scope, 'keydown', event => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    const target = event.target.closest?.(pressSelector);
    if (target) target.setAttribute('data-trail-pressed', '');
  });
  listen(scope, 'keyup', releasePress);

  // app.js owns dialog state, focus restoration and history.  We only notice
  // its native `open` attribute and play an entrance once per actual opening.
  const dialogObserver = new MutationObserver(records => {
    if (reduceMotion()) return;
    records.forEach(record => {
      const dialog = record.target;
      if (!dialog.open) return;
      play(dialog, [
        { opacity: 0, transform: 'translateY(28px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 240, fill: 'both' });
    });
  });
  scope.querySelectorAll('dialog').forEach(dialog => dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  cleanups.push(() => dialogObserver.disconnect());

  // Optional map contract.  A path is drawn exactly once on entry.  `marker`
  // can be an SVG circle/group; it is translated along the same path once.
  const drawPath = path => {
    if (path.dataset.trailDrawn === 'true') return;
    path.dataset.trailDrawn = 'true';
    let length = 0;
    try { length = path.getTotalLength(); } catch { return; }
    if (!length) return;
    const markerSelector = path.dataset.trailMarker;
    const marker = markerSelector ? scope.querySelector(markerSelector) : null;
    if (reduceMotion()) {
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
      if (marker) moveMarker(marker, path, length);
      return;
    }
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    play(path, [{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { duration: 920, fill: 'forwards' });
    if (!marker) return;
    marker.style.opacity = '1';
    const start = performance.now();
    const duration = 880;
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      moveMarker(marker, path, length * progress);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const paths = [...scope.querySelectorAll('[data-trail-path]')];
  if (paths.length && !reduceMotion() && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      drawPath(entry.target);
      observer.unobserve(entry.target);
    }), { threshold: 0.25 });
    paths.forEach(path => observer.observe(path));
    cleanups.push(() => observer.disconnect());
  } else paths.forEach(drawPath);

  const cleanup = () => {
    cleanups.splice(0).reverse().forEach(fn => fn());
    animations.forEach(item => item.cancel());
    animations.clear();
    if (currentCleanup === cleanup) currentCleanup = null;
  };
  currentCleanup = cleanup;
  return cleanup;
}

function moveMarker(marker, path, distance) {
  try {
    const point = path.getPointAtLength(distance);
    marker.setAttribute('transform', `translate(${number(point.x)} ${number(point.y)})`);
  } catch { /* An invalid SVG path is still a usable static map. */ }
}
