#!/usr/bin/env node
// Offline check with headless Chrome: load a built site, wait for the service worker, go offline, reload, expect the page to render.
//   node scripts/check-offline.mjs http://localhost:4190/ [--chrome <path>]
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {arg} from './lib/paths.mjs';

const url = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!url) { console.error('Usage: node scripts/check-offline.mjs <url>'); process.exit(2); }
const chrome = [arg('--chrome'), process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean).find((p) => fs.existsSync(p));
if (!chrome) { console.error('Chrome not found; pass --chrome'); process.exit(2); }
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, '--user-data-dir=' + fs.mkdtempSync((process.env.TMPDIR || '/tmp') + '/offline-'), 'about:blank'], {stdio: 'ignore'});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let exit = 1;
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) { try { target = (await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())).find((t) => t.type === 'page'); } catch {} if (!target) await sleep(250); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } };
  const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({id: n, method, params})); });
  const evaluate = async (expr) => (await send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true})).result?.result?.value;
  await send('Page.enable'); await send('Network.enable');
  await send('Page.navigate', {url}); await sleep(3000);
  const sw = await evaluate(`(async()=>{for(let i=0;i<40;i++){const r=await navigator.serviceWorker.getRegistration();if(r&&r.active)return 'active';await new Promise(r=>setTimeout(r,250));}return 'none'})()`);
  const cached = await evaluate(`(async()=>{const k=await caches.keys();if(!k.length)return 0;const c=await caches.open(k[0]);return (await c.keys()).length})()`);
  console.log(`service worker: ${sw}; cached entries: ${cached}`);
  await send('Network.emulateNetworkConditions', {offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1});
  await send('Page.reload', {ignoreCache: false}); await sleep(3000);
  const title = await evaluate('document.title');
  const days = await evaluate("document.querySelectorAll('details.day').length");
  const status = await evaluate("document.querySelector('#page-status')?.hidden");
  console.log(`offline reload: title="${title}", day cards=${days}, loading-status hidden=${status}`);
  exit = sw === 'active' && days > 0 && status === true ? 0 : 1;
  console.log(exit === 0 ? 'OFFLINE CHECK PASSED' : 'OFFLINE CHECK FAILED');
  ws.close();
} finally { proc.kill(); }
process.exit(exit);
