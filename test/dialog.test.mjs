// Exercise the production close path without waiting for a browser history traversal.
// Native Safari and a real navigated iframe are checked separately in VERIFICATION.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../template/app.js', import.meta.url), 'utf8');
assert.match(source, /\ninit\(\);\s*$/);
const declarations = source.replace(/^import .*;\n/gm, '').replace(/\ninit\(\);\s*$/, '\n');

function fixture() {
  const frames = [], classes = new Set(), calls = [];
  const document = {activeElement: null, body: {classList: {
    add: (name) => classes.add(name), remove: (name) => classes.delete(name),
  }}, querySelector: () => frame};
  const opener = {isConnected: true, closest: () => null, focus: () => { document.activeElement = opener; }};
  document.activeElement = opener;
  let frame = {src: 'local-frame-two.html', cloneNode: () => ({removeAttribute(name) { delete this[name]; }}),
    replaceWith: (blank) => { frame = blank; }};
  const dialog = {open: false, querySelector: () => ({scrollTop: 5}),
    showModal() { this.open = true; }, close() { this.open = false; }};
  const history = {length: 2, state: {page: 'map'},
    pushState(state) { this.state = state; this.length++; },
    back() { calls.push('back'); },
    replaceState(state) { calls.push('replace'); this.state = state; }};
  const window = {scrollY: 200, scrollTo: ({top}) => { window.scrollY = top; }};
  const context = vm.createContext({document, history, window, location: {href: 'http://localhost/#map'},
    requestAnimationFrame: (fn) => frames.push(fn), clearTimeout, dialog});
  vm.runInContext(declarations, context);
  vm.runInContext('openDialog(dialog)', context);
  return {dialog, history, calls, classes, document, opener, window,
    close: () => vm.runInContext('closeDialog()', context),
    flush: () => { frames.splice(0).forEach((fn) => fn()); }, frame: () => frame};
}

test('dialog closes and unlocks immediately even when history.back has not completed', () => {
  const f = fixture();
  f.close();
  assert.equal(f.dialog.open, false);
  assert.equal(f.classes.has('dialog-open'), false);
  assert.equal(f.frame().src, undefined);
  assert.deepEqual(f.calls, ['back']);
  f.close();
  assert.deepEqual(f.calls, ['back'], 'repeat close must not leave the current page');
});

test('iframe history growth cannot make close traverse iframe history or lose the opener', () => {
  const f = fixture();
  f.history.length++;
  f.close();
  assert.equal(f.dialog.open, false);
  assert.deepEqual(f.calls, ['replace']);
  assert.deepEqual(f.history.state, {page: 'map'});
  f.document.activeElement = null;
  f.window.scrollY = 0;
  f.flush();
  assert.equal(f.document.activeElement, f.opener);
  assert.equal(f.window.scrollY, 200);
  f.close();
  assert.deepEqual(f.calls, ['replace']);
});
