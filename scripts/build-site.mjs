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
// Keep the real work intact; the hosted gallery requires its build to succeed.
const showcase = path.join(ROOT, 'showcase/kumano-kodo/dist');
const hasShowcase = fs.existsSync(path.join(showcase, 'index.html'));
if (!hasShowcase && process.argv.includes('--require-showcase')) throw new Error('Build showcase/kumano-kodo before publishing the gallery.');
if (hasShowcase) {
  fs.cpSync(showcase, path.join(out, 'kumano-kodo'), {recursive: true});
  cards.push({name: 'kumano-kodo', title: '熊野古道 · 2026', subtitle: 'The real trip this project grew out of. React + Three.js, hand-written font, opening scene. 35 MB.', theme: 'showcase', locale: 'zh-CN', cover: 'kumano-kodo/assets/forest-cover.webp', days: 6});
}
fs.rmSync(path.join(out, '.manifests'), {recursive: true, force: true});
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
let html = fs.readFileSync(path.join(ROOT, 'site/index.html'), 'utf8');
const copy = {
  'europe-rail': {title:'欧洲铁路 · 八日', description:'从阿姆斯特丹到维也纳，沿铁路穿过四座城市。', label:'RAIL / 08 DAYS'},
  'family-island': {title:'海岛慢游 · 七日', description:'两个大人、两个孩子，在马略卡留一点慢下来的时间。', label:'ISLAND / 07 DAYS'},
  'japan-hiking': {title:'木曾谷山径 · 五日', description:'沿中山道旧宿场走两天，再去松本看城。', label:'TRAIL / 05 DAYS'},
};
html = html.replace('<!--CARDS-->', cards.filter(c=>c.name!=='kumano-kodo').map(c=>{
  const text=copy[c.name]||{title:c.title,description:c.subtitle,label:`${c.days} DAYS`};
  const english={ 'europe-rail':['Europe by Rail · Eight Days','Four cities, from Amsterdam to Vienna, connected by rail.'], 'family-island':['Island Days · One Week','Two adults, two children, and a little time to slow down in Mallorca.'], 'japan-hiking':['Kiso Valley · Five Days','Two days on the old Nakasendo trail, then on to Matsumoto.'] }[c.name] || [c.title,c.subtitle];
  return `<a class="example" href="${esc(c.name)}/"><div class="media">${c.cover ? `<img src="${esc(c.cover)}" alt="" loading="lazy" width="480" height="600">` : ''}</div><div class="body"><b data-cn-text="${esc(text.title)}">${esc(english[0])}</b><p data-cn-text="${esc(text.description)}">${esc(english[1])}</p><small data-cn-text="${esc(text.label)} / 虚构示例 ↗">${esc(text.label)} / FICTIONAL ↗</small></div></a>`;
}).join('\n'));
html = html.replaceAll('__SHOWCASE__',hasShowcase?'kumano-kodo/':'https://kumano-roadbook.pages.dev/?v=hd35');
html = html.replace('__OG_IMAGE__',esc(arg('--site') ? new URL('assets/zine-trail-cover.webp',arg('--site').replace(/\/?$/, '/')).href : 'assets/zine-trail-cover.webp'));
html = html.replace(/__BASE__/g, base);
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
for (const file of ['zine-trail-cover.webp','zine-paper-fine.webp','kumano-walkthrough.mp4','kumano-walkthrough-poster.jpg']) {
  fs.copyFileSync(path.join(ROOT,'site/assets',file),path.join(out,'assets',file));
}
for(const file of ['style.css','language.js']) fs.copyFileSync(path.join(ROOT,'site',file),path.join(out,file));
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Demo site: ${cards.length} roadbooks → ${path.relative(ROOT, out)}/`);
