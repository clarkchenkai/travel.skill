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

test('responsive cover preload and rendered image agree; generated variants are audited and cached', () => {
  const dir = tripFrom('family-island', (d) => d);
  const input = fs.readFileSync(path.join(dir, 'travel-data.json'), 'utf8');
  const b = build(dir);
  const preload = b.html.match(/<link rel="preload" as="image"[^>]+>/)[0];
  const image = b.html.match(/<img src="assets\/cover.webp"[^>]+>/)[0];
  assert.equal(preload.match(/imagesrcset="([^"]+)"/)[1], image.match(/ srcset="([^"]+)"/)[1]);
  assert.equal(preload.match(/imagesizes="([^"]+)"/)[1], image.match(/ sizes="([^"]+)"/)[1]);
  const pub = JSON.parse(fs.readFileSync(path.join(b.out, 'travel-data.json'), 'utf8'));
  assert.deepEqual(pub.imageVariants['assets/cover.webp'].map((v) => v.width), [900, 1800]);
  assert.deepEqual(pub.imageVariants['assets/day-1.webp'].map((v) => v.width), [88, 176]);
  const manifest = JSON.parse(fs.readFileSync(b.manifest, 'utf8'));
  for (const {src} of Object.values(pub.imageVariants).flat()) {
    assert.ok(fs.existsSync(path.join(b.out, src)), src);
    assert.ok(manifest[src], `${src} audited`);
    assert.ok(b.sw.includes('./' + src), `${src} cached`);
  }
  assert.equal(fs.readFileSync(path.join(dir, 'travel-data.json'), 'utf8'), input, 'traveler data is unchanged');
});

test('trips without width-suffixed images retain the original image fallback', () => {
  const dir = tripFrom('family-island', (d) => d);
  for (const name of fs.readdirSync(path.join(dir, 'assets'))) {
    if (/-\d+w\.webp$/.test(name)) fs.unlinkSync(path.join(dir, 'assets', name));
  }
  const b = build(dir);
  assert.doesNotMatch(b.html, /imagesrcset=| srcset=/);
  assert.match(b.html, /<img src="assets\/cover.webp"/);
  const pub = JSON.parse(fs.readFileSync(path.join(b.out, 'travel-data.json'), 'utf8'));
  assert.equal(pub.imageVariants, undefined);
});

test('Chinese builds localize prerendered navigation, skip link and loading fallbacks', () => {
  const b = build(tripFrom('family-island', (d) => ({...d, trip: {...d.trip, locale: 'zh-CN'}})));
  assert.match(b.html, /id="home" aria-label="首页"/);
  assert.match(b.html, /id="days" aria-label="日程"/);
  assert.match(b.html, /aria-label="页面导航" id="bottom-nav"/);
  assert.match(b.html, />跳至每日行程<\/a>/);
  assert.match(b.html, /role="status">正在打开路书…<\/p>/);
  assert.match(b.html, /此路书需要启用 JavaScript 才能显示行程数据。/);
});

test('reusing a photo for a day does not replace its cover sources with tiny thumbnails', () => {
  const dir = tripFrom('family-island', (d) => ({...d, days: d.days.map((day, i) => i ? day : {...day, cover: d.trip.cover.image})}));
  for (const width of [88, 176]) fs.copyFileSync(path.join(dir, `assets/day-1-${width}w.webp`), path.join(dir, `assets/cover-${width}w.webp`));
  const b = build(dir);
  const preload = b.html.match(/<link rel="preload" as="image"[^>]+>/)[0];
  assert.match(preload, /cover-900w.webp 900w/);
  assert.doesNotMatch(preload, /cover-(88|176)w/);
  const pub = JSON.parse(fs.readFileSync(path.join(b.out, 'travel-data.json'), 'utf8'));
  assert.deepEqual(pub.imageVariants['assets/cover.webp'].map((v) => v.width), [88, 176, 900, 1800]);
  const css = fs.readFileSync(path.join(b.out, 'styles.css'), 'utf8');
  assert.match(css, /img\[src="assets\/cover.webp"\] \{ content: url\("assets\/cover-900w.webp"\)/);
});
