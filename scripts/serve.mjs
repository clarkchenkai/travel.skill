#!/usr/bin/env node
// Zero-dependency dev server: template files + the trip's travel-data.json and assets/ on one origin.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, TEMPLATE, tripDir, arg} from './lib/paths.mjs';

const trip = tripDir();
const port = Number(arg('--port') || process.env.PORT || 4173);
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.ico': 'image/x-icon'};

export function resolveFile(urlPath, {template = TEMPLATE, tripRoot = trip} = {}) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const rel = path.posix.normalize(p).replace(/^\/+/, '');
  if (rel.startsWith('..')) return null;
  // Trip files win so a trip can override cover images or add assets; template files are the fallback.
  const candidates = rel === 'travel-data.json' || rel.startsWith('assets/')
    ? [path.join(tripRoot, rel), path.join(template, rel)]
    : [path.join(template, rel), path.join(tripRoot, rel)];
  for (const file of candidates) {
    const root = file.startsWith(tripRoot) ? tripRoot : template;
    if (path.resolve(file).startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  // --dist <dir>: serve a built directory as-is (for previewing dist/ with the service worker; python's http.server cannot).
  const dist = arg('--dist');
  if (dist) {
    const root = path.resolve(ROOT, dist);
    if (!fs.existsSync(path.join(root, 'index.html'))) { console.error(`No index.html in ${root}. Run npm run build first.`); process.exit(2); }
    http.createServer((req, res) => {
      let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const file = path.join(root, path.posix.normalize(p));
      if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404, {'content-type': 'text/plain'}); res.end('Not found'); return; }
      res.writeHead(200, {'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store'});
      fs.createReadStream(file).pipe(res);
    }).listen(port, () => console.log(`Built site preview:  http://localhost:${port}/\nServing:             ${root}\nOffline cache (service worker) is active here; Ctrl+C to stop.`));
  } else {
  if (!fs.existsSync(path.join(trip, 'travel-data.json'))) {
    console.error(`No travel-data.json in ${trip}\nStart from an example:  npm run new -- japan-hiking`);
    process.exit(2);
  }
  const server = http.createServer((req, res) => {
    const file = resolveFile(req.url || '/');
    if (!file) { res.writeHead(404, {'content-type': 'text/plain'}); res.end('Not found'); return; }
    res.writeHead(200, {'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store'});
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, () => {
    console.log(`Roadbook preview:  http://localhost:${port}/\nTrip folder:       ${trip}\nEdit travel-data.json and reload. Ctrl+C to stop.`);
  });
  }
}
