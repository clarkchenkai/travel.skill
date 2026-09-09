import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');
const packs = Object.fromEntries(['en', 'zh-CN'].map((locale) => [locale, JSON.parse(read(`../template/i18n/${locale}.json`))]));
const app = read('../template/app.js');

function leaves(value, prefix = '', out = {}) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) leaves(child, path, out);
    else { assert.equal(typeof child, 'string', path); assert.ok(child.trim(), path); out[path] = child; }
  }
  return out;
}
const flat = Object.fromEntries(Object.entries(packs).map(([locale, pack]) => [locale, leaves(pack)]));
const quoted = (text) => [...text.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
const placeholders = (text) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
const requireKey = (key) => {
  for (const [locale, strings] of Object.entries(flat)) assert.ok(Object.hasOwn(strings, key), `${locale}: missing ${key}`);
};

test('English and Chinese have identical non-empty leaf keys and interpolation variables', () => {
  assert.deepEqual(Object.keys(flat.en).sort(), Object.keys(flat['zh-CN']).sort());
  for (const key of Object.keys(flat.en)) {
    assert.deepEqual(placeholders(flat.en[key]), placeholders(flat['zh-CN'][key]), `${key}: interpolation variables`);
  }
});

test('literal t/plural calls reference existing translations, including singular forms', () => {
  const refs = [...app.matchAll(/\b(t|plural)\(\s*(['"])([^'"]+)\2\s*(?=[,)])/g)];
  assert.ok(refs.length > 0);
  for (const [, fn, , key] of refs) {
    requireKey(key);
    if (fn === 'plural') requireKey(key + '_one');
  }
});

test('dynamic translation families cover every declared page, status and checklist filter', () => {
  const pages = quoted(app.match(/const PAGES = \[([^\]]+)\]/)[1]);
  const statuses = quoted(read('../scripts/lib/validate.mjs').match(/const STATUS = new Set\(\[([^\]]+)\]/)[1]);
  const groups = quoted(app.match(/\[([^\]]+)\]\.map\(\(g\)/)[1]);
  const domains = {'nav.:id': pages, 'transport.status.:status': statuses, 'checklist.:g': groups};
  const dynamic = [...app.matchAll(/\bt\(\s*(['"])([^'"]+)\1\s*\+\s*(\w+)\s*\)/g)];
  for (const [, , prefix, variable] of dynamic) {
    const values = domains[`${prefix}:${variable}`];
    assert.ok(values?.length, `Unclassified dynamic translation: ${prefix} + ${variable}`);
    for (const value of values) requireKey(prefix + value);
  }
  // Fail on a new call form rather than silently excluding it from this dependency-free scan.
  const literalCount = [...app.matchAll(/\b(t|plural)\(\s*(['"])([^'"]+)\2\s*(?=[,)])/g)].length;
  const forwarded = [...app.matchAll(/\bt\(path,\s*\{n,\s*\.\.\.vars\}\)/g)].length;
  assert.equal(forwarded, 1, 'plural forwards its base key to t');
  assert.equal([...app.matchAll(/\b(?:t|plural)\(/g)].length, literalCount + dynamic.length + forwarded, 'every translation call is classified');
});
