#!/usr/bin/env node
// Real screenshots of a running preview with headless Chrome over the DevTools protocol. No dependencies.
//   node scripts/screenshot.mjs <url> <out.png> [--mobile | --width 1280 --height 860] [--chrome <path>]
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {arg, flag} from './lib/paths.mjs';

const [url, out] = process.argv.slice(2).filter((a, i, arr) => !a.startsWith('--') && !(arr[i - 1] || '').startsWith('--'));
if (!url || !out) { console.error('Usage: node scripts/screenshot.mjs <url> <out.png> [--mobile] [--width N --height N] [--chrome <path>]'); process.exit(2); }
const mobile = flag('--mobile');
const width = Number(arg('--width') || (mobile ? 390 : 1280)), height = Number(arg('--height') || (mobile ? 844 : 860));
const candidates = [arg('--chrome'), process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
const chrome = candidates.find((p) => fs.existsSync(p));
if (!chrome) { console.error('Chrome/Chromium not found. Pass --chrome <path> or set CHROME.'); process.exit(2); }

const port = 9222 + Math.floor(Math.random() * 1000);
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'shot-')), 'about:blank'], {stdio: 'ignore'});
try {
  const target = await waitFor(async () => {
    const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
    return list.find((t) => t.type === 'page');
  });
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } };
  const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({id: n, method, params})); });
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 2, mobile, screenWidth: width, screenHeight: height});
  if (mobile) await send('Emulation.setTouchEmulationEnabled', {enabled: true});
  await send('Page.enable');
  await send('Page.navigate', {url});
  await new Promise((r) => setTimeout(r, 2500));
  const shot = await send('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width, height, scale: 1}});
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  ws.close();
  console.log(`Saved ${out} (${width}x${height}${mobile ? ', mobile' : ''})`);
} finally { proc.kill(); }

async function waitFor(fn, tries = 40) {
  for (let i = 0; i < tries; i++) { try { const v = await fn(); if (v) return v; } catch {} await new Promise((r) => setTimeout(r, 250)); }
  throw new Error('Chrome did not start');
}
