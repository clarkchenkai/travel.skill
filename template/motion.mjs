// Progressive motion layer, adapted from the Kumano roadbook's trail-motion.mjs.
// No data dependency: the page is fully usable if this module is skipped. Respects prefers-reduced-motion.
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
const animate = (node, keyframes, options) => (!node?.animate || reduceMotion()) ? null : node.animate(keyframes, {easing: 'cubic-bezier(.22,.7,.25,1)', ...options});

let cleanup = null;
export function initMotion(scope = document) {
  cleanup?.();
  const cleanups = [];
  const listen = (node, type, handler, options) => { node.addEventListener(type, handler, options); cleanups.push(() => node.removeEventListener(type, handler, options)); };

  // Day cards: animate height after the native <details> state changes, so state and a11y stay correct.
  scope.querySelectorAll('details.day').forEach((day) => {
    const content = day.querySelector(':scope > .day-body');
    const summary = day.querySelector(':scope > summary');
    if (!content || !summary) return;
    let fold = null, desiredOpen = day.open;
    listen(summary, 'click', (event) => {
      if (reduceMotion()) return;
      if (!fold) desiredOpen = day.open;
      event.preventDefault();
      const from = day.open ? content.getBoundingClientRect().height : 0;
      desiredOpen = !desiredOpen;
      fold?.cancel();
      day.open = true;
      const to = desiredOpen ? content.scrollHeight : 0;
      content.style.overflow = 'hidden';
      const current = animate(content, [{height: from + 'px'}, {height: to + 'px'}], {duration: Math.min(520, 260 + Math.abs(to - from) * .05), easing: 'cubic-bezier(.22,.65,.25,1)'});
      fold = current;
      if (!current) { day.open = desiredOpen; content.style.overflow = ''; return; }
      current.finished.then(() => { if (fold !== current) return; day.open = desiredOpen; fold = null; content.style.overflow = ''; }).catch(() => {});
    });
    listen(day, 'toggle', () => {
      if (!day.open || reduceMotion()) return;
      [...content.children].forEach((child, i) => animate(child, [{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 240, delay: Math.min(i * 36, 180), fill: 'both'}));
    });
  });

  // One subtle arrival cue per card the first time it scrolls into view. Never hides content.
  if (!reduceMotion() && 'IntersectionObserver' in window) {
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting || seen.has(e.target)) return;
      seen.add(e.target);
      animate(e.target, [{opacity: .7, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 340, fill: 'both'});
      io.unobserve(e.target);
    }), {threshold: .12, rootMargin: '0px 0px -5% 0px'});
    scope.querySelectorAll('.card, .day, .flight-card, .home-card, .task').forEach((n) => io.observe(n));
    cleanups.push(() => io.disconnect());
  }

  // Press feedback on tappable controls.
  const pressSelector = 'button, .chip, .pill, .tab, .home-card, .bottom-nav a';
  const pressed = new WeakMap();
  const release = (event) => {
    const target = event.target.closest?.('[data-pressed]');
    if (!target) return;
    pressed.get(target)?.cancel(); pressed.delete(target);
    target.removeAttribute('data-pressed');
    animate(target, [{transform: 'scale(.975)'}, {transform: 'scale(1)'}], {duration: 110});
  };
  listen(scope, 'pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target.closest?.(pressSelector);
    if (!target || target.disabled) return;
    target.setAttribute('data-pressed', '');
    const a = animate(target, [{transform: 'scale(1)'}, {transform: 'scale(.975)'}], {duration: 90, fill: 'forwards'});
    if (a) pressed.set(target, a);
  });
  listen(scope, 'pointerup', release); listen(scope, 'pointercancel', release); listen(scope, 'pointerleave', release, true);
  listen(scope, 'keydown', (e) => { if (!e.repeat && (e.key === 'Enter' || e.key === ' ')) e.target.closest?.(pressSelector)?.setAttribute('data-pressed', ''); });
  listen(scope, 'keyup', release);

  // Dialog entrance, once per actual opening. app.js keeps owning state, focus and history.
  const mo = new MutationObserver((records) => { if (reduceMotion()) return; records.forEach((r) => { if (r.target.open) animate(r.target, [{opacity: 0, transform: 'translateY(24px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 220, fill: 'both'}); }); });
  scope.querySelectorAll('dialog').forEach((d) => mo.observe(d, {attributes: true, attributeFilter: ['open']}));
  cleanups.push(() => mo.disconnect());

  cleanup = () => { cleanups.forEach((fn) => fn()); cleanup = null; };
  return cleanup;
}
