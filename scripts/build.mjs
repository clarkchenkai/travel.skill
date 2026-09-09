#!/usr/bin/env node
// Build a static site into dist/: template + trip data + trip assets, then write a hash manifest outside dist/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT, TEMPLATE, tripDir, readJSON, arg} from './lib/paths.mjs';
import {validateTravelData} from './lib/validate.mjs';

const trip = tripDir();
const out = path.resolve(ROOT, arg('--out') || 'dist');
const manifestPath = path.resolve(ROOT, arg('--manifest') || path.join('artifacts', 'manifest.json'));
const dataFile = path.join(trip, 'travel-data.json');
if (!fs.existsSync(dataFile)) { console.error(`No travel-data.json in ${trip}`); process.exit(2); }
const data = readJSON(dataFile);
const {errors} = validateTravelData(data);
if (errors.length) { console.error(`Refusing to build: ${errors.length} validation error(s). Run npm run validate.`); process.exit(1); }
if (path.resolve(manifestPath).startsWith(out + path.sep)) { console.error('The manifest must live outside the output directory.'); process.exit(1); }

const TEMPLATE_FILES = ['index.html', 'styles.css', 'themes.css', 'app.js', 'core.mjs', 'motion.mjs', 'i18n/en.json', 'i18n/zh-CN.json'];
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});
const written = [];
const copy = (src, rel) => { const dest = path.join(out, rel); fs.mkdirSync(path.dirname(dest), {recursive: true}); fs.copyFileSync(src, dest); written.push(rel); };
for (const rel of TEMPLATE_FILES) copy(path.join(TEMPLATE, rel), rel);

// Inject title/lang/description and the theme so the first paint has no flash and crawlers see a title.
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
html = html.replace('<html lang="en">', `<html lang="${esc(data.trip.locale || 'en')}" data-theme="${esc(data.trip.theme || 'field-notes')}">`)
  .replace('<title>Roadbook</title>', `<title>${esc(data.trip.title)}</title>`)
  .replace('content="A personal travel roadbook."', `content="${esc(data.trip.subtitle || data.trip.title)}"`);
if (data.trip.cover?.image) html = html.replace('<link rel="stylesheet" href="styles.css">', `<link rel="preload" as="image" href="${esc(data.trip.cover.image)}" fetchpriority="high">\n<link rel="stylesheet" href="styles.css">`);
fs.writeFileSync(path.join(out, 'index.html'), html);

// Public data: strip private records and anything under privateData, then re-serialize.
const publicData = stripPrivate(data);
fs.writeFileSync(path.join(out, 'travel-data.json'), JSON.stringify(publicData, null, 2) + '\n');
written.push('travel-data.json');

// Assets: only files the data references, plus files listed in trip.publishAssets.
const referenced = new Set();
walk(publicData, (v) => { if (typeof v === 'string' && v.startsWith('assets/')) referenced.add(v); });
for (const extra of data.publishAssets || []) referenced.add(extra);
for (const rel of [...referenced].sort()) {
  const src = path.join(trip, rel);
  if (!fs.existsSync(src)) { console.error(`Referenced asset missing: ${rel}`); process.exit(1); }
  copy(src, rel);
}
for (const rel of ['LICENSE', 'ASSETS.md']) { const f = path.join(trip, rel); if (fs.existsSync(f)) copy(f, rel); }

const manifest = {};
for (const rel of written.sort()) manifest[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(out, rel))).digest('hex');
fs.mkdirSync(path.dirname(manifestPath), {recursive: true});
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const bytes = written.reduce((n, rel) => n + fs.statSync(path.join(out, rel)).size, 0);
console.log(`Built ${written.length} files (${(bytes / 1024).toFixed(0)} KB) into ${path.relative(ROOT, out)}/; manifest at ${path.relative(ROOT, manifestPath)}.`);
console.log('Next: npm run check  (static release audit), then upload dist/ to any static host.');

function stripPrivate(value) {
  if (Array.isArray(value)) return value.map(stripPrivate).filter((v) => v !== undefined);
  if (value && typeof value === 'object') {
    if (value.privacy === 'private' || value.privacy === 'restricted') return undefined;
    const out = {};
    for (const [k, v] of Object.entries(value)) { if (k === 'privateData') continue; const r = stripPrivate(v); if (r !== undefined) out[k] = r; }
    return out;
  }
  return value;
}
function walk(value, fn) { fn(value); if (Array.isArray(value)) value.forEach((v) => walk(v, fn)); else if (value && typeof value === 'object') Object.values(value).forEach((v) => walk(v, fn)); }
