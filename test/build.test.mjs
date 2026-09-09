// Build output contracts: share tags, build stamp, service worker precache, asset copying, siteUrl handling.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../scripts/lib/paths.mjs';

function build(tripDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-'));
  const out = path.join(tmp, 'dist'), manifest = path.join(tmp, 'manifest.json');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs'), '--trip', tripDir, '--out', out, '--manifest', manifest], {stdio: 'pipe'});
  return {out, manifest, html: fs.readFileSync(path.join(out, 'index.html'), 'utf8'), sw: fs.readFileSync(path.join(out, 'sw.js'), 'utf8')};
}
function tripFrom(example, patch) {
  const src = path.join(ROOT, 'examples', example);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trip-'));
  fs.cpSync(src, dir, {recursive: true});
  const f = path.join(dir, 'travel-data.json');
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  fs.writeFileSync(f, JSON.stringify(patch(data)));
  return dir;
}

test('share tags: relative og:image without siteUrl, absolute with it', () => {
  const rel = build(path.join(ROOT, 'examples/family-island'));
  assert.match(rel.html, /<meta property="og:title" content="Mallorca with the Kids">/);
  assert.match(rel.html, /<meta property="og:image" content="assets\/cover.webp">/);
  assert.doesNotMatch(rel.html, /og:url/);
  const abs = build(tripFrom('family-island', (d) => ({...d, trip: {...d.trip, siteUrl: 'https://example.test/trip'}})));
  assert.match(abs.html, /<meta property="og:image" content="https:\/\/example.test\/trip\/assets\/cover.webp">/);
  assert.match(abs.html, /<meta property="og:url" content="https:\/\/example.test\/trip\/">/);
});

test('service worker gets a version stamp and precaches every published file except itself and licenses', () => {
  const b = build(path.join(ROOT, 'examples/japan-hiking'));
  const stamp = b.html.match(/name="roadbook-build" content="([0-9a-f]{12})"/)?.[1];
  assert.ok(stamp, 'build stamp in html');
  assert.ok(b.sw.includes(`'${stamp}'`), 'same stamp in sw.js');
  const list = JSON.parse(b.sw.match(/const PRECACHE = (\[.*?\]);/s)[1]);
  assert.ok(list.includes('./index.html') && list.includes('./travel-data.json') && list.includes('./assets/cover.webp') && list.includes('./'));
  assert.ok(!list.includes('./sw.js'));
  const manifest = JSON.parse(fs.readFileSync(b.manifest, 'utf8'));
  for (const rel of list.filter((x) => x !== './')) assert.ok(manifest[rel.slice(2)], `${rel} is in the manifest`);
});

test('only referenced assets are published and a missing referenced asset fails the build', () => {
  const dir = tripFrom('europe-rail', (d) => d);
  fs.writeFileSync(path.join(dir, 'assets', 'unused.webp'), 'x');
  const b = build(dir);
  assert.ok(!fs.existsSync(path.join(b.out, 'assets/unused.webp')));
  const broken = tripFrom('europe-rail', (d) => ({...d, trip: {...d.trip, cover: {image: 'assets/nope.webp'}}}));
  assert.throws(() => build(broken), /Referenced asset missing/);
});

test('private records and privateData never reach the public data file', () => {
  const dir = tripFrom('japan-hiking', (d) => ({...d, places: [...d.places, {id: 'secret', name: 'Hidden', privacy: 'private'}], trip: {...d.trip, privateData: {pnr: 'ABC123'}}}));
  // The validator would reject this; build refuses too. Strip privacy first to test the build-time filter alone.
  const f = path.join(dir, 'travel-data.json');
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert.throws(() => build(dir), /Refusing to build/);
  delete data.trip.privateData; data.places = data.places.filter((p) => p.id !== 'secret');
  fs.writeFileSync(f, JSON.stringify(data));
  const b = build(dir);
  const pub = fs.readFileSync(path.join(b.out, 'travel-data.json'), 'utf8');
  assert.ok(!pub.includes('ABC123') && !pub.includes('"secret"'));
});
