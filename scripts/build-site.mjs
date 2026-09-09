#!/usr/bin/env node
// Build the project demo site: every example under its own folder plus a chooser page. Output: site-dist/.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, arg} from './lib/paths.mjs';

const out = path.resolve(ROOT, arg('--out') || 'site-dist');
const base = (arg('--base') || '/').replace(/\/?$/, '/');   // e.g. /travel.skill/ on GitHub Pages
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});
const examples = fs.readdirSync(path.join(ROOT, 'examples')).filter((d) => fs.existsSync(path.join(ROOT, 'examples', d, 'travel-data.json')));
const cards = [];
for (const name of examples) {
  const dir = path.join(ROOT, 'examples', name);
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'travel-data.json'), 'utf8'));
  const siteUrl = arg('--site') ? arg('--site').replace(/\/?$/, '/') + name + '/' : '';
  const tmp = path.join(out, '.tmp-' + name); fs.mkdirSync(tmp, {recursive: true});
  // Inject siteUrl for absolute og:image without touching the example source.
  const patched = {...data, trip: {...data.trip, ...(siteUrl ? {siteUrl} : {})}};
  fs.writeFileSync(path.join(tmp, 'travel-data.json'), JSON.stringify(patched));
  if (fs.existsSync(path.join(dir, 'assets'))) fs.cpSync(path.join(dir, 'assets'), path.join(tmp, 'assets'), {recursive: true});
  for (const f of ['ASSETS.md']) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(tmp, f));
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs'), '--trip', tmp, '--out', path.join(out, name), '--manifest', path.join(out, '.manifests', name + '.json')], {stdio: 'inherit'});
  fs.rmSync(tmp, {recursive: true, force: true});
  cards.push({name, title: data.trip.title, subtitle: data.trip.subtitle || '', theme: data.trip.theme, locale: data.trip.locale, cover: data.trip.cover?.image ? `${name}/${data.trip.cover.image}` : '', days: data.days.length});
}
// Showcase: if it has been built (showcase/kumano-kodo/dist), include it as-is.
const showcase = path.join(ROOT, 'showcase/kumano-kodo/dist');
if (fs.existsSync(path.join(showcase, 'index.html'))) {
  fs.cpSync(showcase, path.join(out, 'kumano-kodo'), {recursive: true});
  cards.push({name: 'kumano-kodo', title: '熊野古道 · 2026', subtitle: 'The real trip this project grew out of. React + Three.js, hand-written font, opening scene. 35 MB.', theme: 'showcase', locale: 'zh-CN', cover: 'kumano-kodo/assets/forest-cover.webp', days: 6});
}
fs.rmSync(path.join(out, '.manifests'), {recursive: true, force: true});
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
let html = fs.readFileSync(path.join(ROOT, 'site/index.html'), 'utf8');
html = html.replace('<!--CARDS-->', cards.map((c) => `<a class="card" href="${esc(c.name)}/"><div class="media">${c.cover ? `<img src="${esc(c.cover)}" alt="" loading="lazy">` : ''}</div><div class="body"><b>${esc(c.title)}</b><p>${esc(c.subtitle)}</p><small>${esc(c.theme)} · ${esc(c.locale)} · ${c.days} days</small></div></a>`).join('\n'));
html = html.replace(/__BASE__/g, base);
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Demo site: ${cards.length} roadbooks → ${path.relative(ROOT, out)}/`);
