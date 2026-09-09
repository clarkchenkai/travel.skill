#!/usr/bin/env node
// Build a static site into dist/: template + trip data + trip assets, then write a hash manifest outside dist/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT, TEMPLATE, tripDir, readJSON, arg} from './lib/paths.mjs';
import {validateTravelData} from './lib/validate.mjs';
import {ICONS} from '../template/icons.mjs';

const trip = tripDir();
const out = path.resolve(ROOT, arg('--out') || 'dist');
const manifestPath = path.resolve(ROOT, arg('--manifest') || path.join('artifacts', 'manifest.json'));
const dataFile = path.join(trip, 'travel-data.json');
if (!fs.existsSync(dataFile)) { console.error(`No travel-data.json in ${trip}`); process.exit(2); }
const data = readJSON(dataFile);
const {errors} = validateTravelData(data);
if (errors.length) { console.error(`Refusing to build: ${errors.length} validation error(s). Run npm run validate.`); process.exit(1); }
if (path.resolve(manifestPath).startsWith(out + path.sep)) { console.error('The manifest must live outside the output directory.'); process.exit(1); }

// Optional width-suffixed files produced by optimize-images.py. No Python is needed to build.
const publicData = stripPrivate(data);
const imageVariants = {};
for (const [image, widths] of [[data.trip.cover?.image, [900, 1800]], ...(data.days || []).map((day) => [day.cover, [88, 176]])]) {
  if (!image?.startsWith('assets/')) continue;
  const parsed = path.posix.parse(image);
  const variants = widths.map((width) => ({src: `${parsed.dir}/${parsed.name}-${width}w.webp`, width}))
    .filter(({src}) => fs.existsSync(path.join(trip, src)));
  if (variants.length) imageVariants[image] = variants;
}
// Derived build metadata, not another traveler-maintained data source.
delete publicData.imageVariants;
if (Object.keys(imageVariants).length) publicData.imageVariants = imageVariants;
const coverSizes = '(min-width: 900px) 1088px, (min-width: 720px) 688px, calc(100vw - 32px)';
const coverSet = (imageVariants[data.trip.cover?.image] || []).map(({src, width}) => `${src} ${width}w`).join(', ');

const buildStamp = crypto.createHash('sha256').update(JSON.stringify(data) + Date.now()).digest('hex').slice(0, 12);
const TEMPLATE_FILES = ['index.html', 'styles.css', 'themes.css', 'app.js', 'core.mjs', 'motion.mjs', 'icons.mjs', 'sw.js', 'i18n/en.json', 'i18n/zh-CN.json'];
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
if (data.trip.cover?.image) html = html.replace('<link rel="stylesheet" href="styles.css">', `<link rel="preload" as="image" href="${esc(data.trip.cover.image)}"${coverSet ? ` imagesrcset="${esc(coverSet)}" imagesizes="${coverSizes}"` : ''} fetchpriority="high">\n<link rel="stylesheet" href="styles.css">`);
// Share card. og:image must be absolute for most crawlers: set trip.siteUrl (e.g. "https://you.github.io/trip/").
const site = data.trip.siteUrl ? String(data.trip.siteUrl).replace(/\/?$/, '/') : '';
const ogImage = data.trip.cover?.image ? (site ? site + data.trip.cover.image : data.trip.cover.image) : '';
const og = [
  `<meta property="og:type" content="website">`,
  `<meta property="og:title" content="${esc(data.trip.title)}">`,
  `<meta property="og:description" content="${esc(data.trip.subtitle || data.trip.title)}">`,
  ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : '',
  site ? `<meta property="og:url" content="${esc(site)}">` : '',
  `<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">`,
  `<meta name="roadbook-build" content="${buildStamp}">`,
].filter(Boolean).join('\n');
html = html.replace('<link rel="stylesheet" href="styles.css">', og + '\n<link rel="stylesheet" href="styles.css">');
// Pre-render text that app.js will render identically, so the first paint has the final layout (no shift).
const pack = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'i18n', (data.trip.locale || 'en').startsWith('zh') ? 'zh-CN.json' : 'en.json'), 'utf8'));
if (data.trip.demo) html = html.replace('<aside class="demo-notice" id="demo-notice" hidden></aside>', `<aside class="demo-notice" id="demo-notice">${esc(data.trip.demoNotice || pack.demoNotice)}</aside>`);
html = html.replace('<b id="identity-title">Roadbook</b><small id="identity-meta"></small>', `<b id="identity-title">${esc(data.trip.shortTitle || data.trip.title)}</b><small id="identity-meta">${esc(data.trip.eyebrow || (data.trip.countries || []).join(' · '))}</small>`)
  .replace('<p class="cover-eyebrow" id="cover-eyebrow"></p>', `<p class="cover-eyebrow" id="cover-eyebrow">${esc(data.trip.eyebrow || '')}</p>`)
  .replace('<h1 id="cover-title"></h1>', `<h1 id="cover-title">${esc(data.trip.title)}</h1>`)
  .replace('<p class="cover-subtitle" id="cover-subtitle"></p>', `<p class="cover-subtitle" id="cover-subtitle">${esc(data.trip.subtitle || '')}</p>`)
  .replace('<a class="cover-action" id="cover-action" href="#days"></a>', `<a class="cover-action" id="cover-action" href="#days">${esc(pack.cover.open)}</a>`);
html = html.replace('<nav class="bottom-nav" aria-label="Sections" id="bottom-nav"></nav>', `<nav class="bottom-nav" aria-label="Sections" id="bottom-nav">${['home', 'map', 'days', 'transport', 'checklist'].map((id) => `<a href="#${id}"${id === 'home' ? ' aria-current="page"' : ''}>${ICONS[id]}<span>${esc(pack.nav[id])}</span></a>`).join('')}</nav>`);
// Pre-render the cover shell so the first paint already reserves the image box (avoids layout shift).
if (data.trip.cover?.image) {
  html = html.replace('<div class="cover" id="cover">', `<div class="cover has-image" id="cover" data-copy="${esc(data.trip.cover.copy || 'top-left')}">`)
    .replace('<div class="cover-media" id="cover-media" aria-hidden="true"></div>', `<div class="cover-media" id="cover-media" aria-hidden="true"><img src="${esc(data.trip.cover.image)}"${coverSet ? ` srcset="${esc(coverSet)}" sizes="${coverSizes}"` : ''} alt="" fetchpriority="high" style="object-position:${esc(data.trip.cover.position || 'center')}"></div>`);
}
fs.writeFileSync(path.join(out, 'index.html'), html);

// Public data: strip private records and anything under privateData, then re-serialize.
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

// Service worker precache: everything written so far except sw.js itself and the license docs.
const precache = written.filter((rel) => !['sw.js', 'LICENSE', 'ASSETS.md'].includes(rel)).map((rel) => './' + rel);
fs.writeFileSync(path.join(out, 'sw.js'), fs.readFileSync(path.join(TEMPLATE, 'sw.js'), 'utf8').replace('__VERSION__', buildStamp).replace('__PRECACHE__', JSON.stringify(precache.concat(['./']))));
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
