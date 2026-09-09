#!/usr/bin/env node
// Zero-dependency dev server: template files + the trip's travel-data.json and assets/ on one origin.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, TEMPLATE, tripDir, arg} from './lib/paths.mjs';
import {selectTemplate,localFile,templateFile,localePack} from './lib/templates.mjs';

const trip = tripDir();
const selectedTemplate = selectTemplate(trip,arg('--template'));
const port = Number(arg('--port') || process.env.PORT || 4173);
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon'};

export function resolveFile(urlPath, {template = TEMPLATE, tripRoot = trip} = {}) {
  let p;try{p=decodeURIComponent(urlPath.split('?')[0]);}catch{return null;}
  if (p.endsWith('/')) p += 'index.html';
  const rel = path.posix.normalize(p).replace(/^\/+/, '');
  if (rel.startsWith('..')) return null;
  // Only public trip data/assets and declared template files are served.
  try {
    if (rel === 'travel-data.json' || rel.startsWith('assets/')) return localFile(tripRoot,rel);
    const selected = template === TEMPLATE ? selectTemplate(tripRoot) : {root:template,files:selectedTemplate.files};
    if (selected.files.includes(rel)) return templateFile(selected,rel);
  } catch { return null; }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  // --dist <dir>: serve a built directory as-is (for previewing dist/ with the service worker; python's http.server cannot).
  const dist = arg('--dist');
  if (dist) {
    const root = path.resolve(ROOT, dist);
    if (!fs.existsSync(path.join(root, 'index.html'))) { console.error(`No index.html in ${root}. Run npm run build first.`); process.exit(2); }
    http.createServer((req, res) => {
      let p;try{p=decodeURIComponent((req.url||'/').split('?')[0]);}catch{res.writeHead(400);res.end('Invalid path');return;} if (p.endsWith('/')) p += 'index.html';
      let file; try {file=localFile(root,path.posix.normalize(p).replace(/^\/+/,''));} catch {}
      if (!file) { res.writeHead(404, {'content-type': 'text/plain'}); res.end('Not found'); return; }
      res.writeHead(200, {'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store'});
      fs.createReadStream(file).pipe(res);
    }).listen(port, arg('--host')||'127.0.0.1', () => console.log(`Built site preview:  http://localhost:${port}/\nServing:             ${root}\nOffline cache (service worker) is active here; Ctrl+C to stop.`));
  } else {
  if (!fs.existsSync(path.join(trip, 'travel-data.json'))) {
    console.error(`No travel-data.json in ${trip}\nStart from an example:  npm run new -- japan-hiking`);
    process.exit(2);
  }
  const server = http.createServer((req, res) => {
    const file = resolveFile(req.url || '/', {template:selectedTemplate.root, tripRoot:trip});
    if (!file) { res.writeHead(404, {'content-type': 'text/plain'}); res.end('Not found'); return; }
    res.writeHead(200, {'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store'});
    if(file===localFile(trip,'travel-data.json')){try{const data=JSON.parse(fs.readFileSync(file,'utf8'));data.ui={...data.ui,localePack:localePack(data,selectedTemplate)};res.end(JSON.stringify(data));}catch{res.end(fs.readFileSync(file));}return;}
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, arg('--host')||'127.0.0.1', () => {
    console.log(`Roadbook preview:  http://localhost:${port}/\nTrip folder:       ${trip}\nEdit travel-data.json and reload. Ctrl+C to stop.`);
  });
  }
}
