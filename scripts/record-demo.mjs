#!/usr/bin/env node
// Record a real walkthrough of a running roadbook as PNG frames (mobile viewport) and, if ffmpeg exists, a GIF + MP4.
//   node scripts/record-demo.mjs http://localhost:4173/ docs/demo [--chrome <path>]
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {arg} from './lib/paths.mjs';

const [url, outDir] = process.argv.slice(2).filter((a, i, arr) => !a.startsWith('--') && !(arr[i - 1] || '').startsWith('--'));
if (!url || !outDir) { console.error('Usage: node scripts/record-demo.mjs <url> <outDir>'); process.exit(2); }
const chrome = [arg('--chrome'), process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
if (!chrome) { console.error('Chrome not found'); process.exit(2); }
fs.rmSync(outDir, {recursive: true, force: true}); fs.mkdirSync(outDir, {recursive: true});
const W = 390, H = 780;
const port = 9600 + Math.floor(Math.random() * 300);
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'rec-')), 'about:blank'], {stdio: 'ignore'});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let frame = 0;
try {
  let target; for (let i = 0; i < 40 && !target; i++) { try { target = (await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())).find((t) => t.type === 'page'); } catch {} if (!target) await sleep(250); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } };
  const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({id: n, method, params})); });
  const ev = (expr) => send('Runtime.evaluate', {expression: expr, awaitPromise: true});
  const shot = async (n = 1, gap = 120) => { for (let i = 0; i < n; i++) { const r = await send('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: W, height: H, scale: 1}}); fs.writeFileSync(path.join(outDir, `f${String(frame++).padStart(4, '0')}.png`), Buffer.from(r.result.data, 'base64')); if (i < n - 1) await sleep(gap); } };
  await send('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 2, mobile: true});
  await send('Page.enable'); await send('Page.navigate', {url}); await sleep(2500);
  // Home, then scroll a little (parallax), then Days.
  await shot(8, 150);
  for (let y = 0; y <= 300; y += 60) { await ev(`window.scrollTo(0, ${y})`); await shot(1); }
  await ev(`location.hash='#days'`); await sleep(500); await shot(6, 150);
  // Open day 2, then tap its first place chip.
  await ev(`document.querySelector('#day-2 summary').click()`); for (let i = 0; i < 8; i++) { await sleep(80); await shot(1); }
  await ev(`document.querySelector('#day-2').scrollIntoView({block:'start'})`); await sleep(200); await shot(4, 150);
  await ev(`document.querySelector('#day-2 [data-map]').click()`); for (let i = 0; i < 6; i++) { await sleep(100); await shot(1); } await shot(8, 200);
  await ev(`document.querySelector('#map-close').click()`); await sleep(300); await shot(4, 150);
  // Transport: next flight.
  await ev(`location.hash='#transport'`); await sleep(600); await shot(6, 150);
  await ev(`document.querySelector('[data-flight="1"]').click()`); for (let i = 0; i < 8; i++) { await sleep(80); await shot(1); } await shot(4, 200);
  // Checklist: add an item and check it.
  await ev(`location.hash='#checklist'`); await sleep(500); await shot(4, 150);
  await ev(`const i=document.querySelector('#check-input'); i.focus(); i.value='Sunscreen'; `); await shot(3, 150);
  await ev(`document.querySelector('#check-form').requestSubmit()`); await sleep(300); await shot(4, 150);
  await ev(`[...document.querySelectorAll('.task input')].at(-1).click()`); await sleep(300); await shot(8, 200);
  ws.close();
} finally { proc.kill(); }
console.log(`${frame} frames in ${outDir}`);
try {
  execFileSync('ffmpeg', ['-y', '-framerate', '8', '-i', path.join(outDir, 'f%04d.png'), '-vf', 'fps=8,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5', path.join(outDir, 'demo.gif')], {stdio: 'ignore'});
  execFileSync('ffmpeg', ['-y', '-framerate', '8', '-i', path.join(outDir, 'f%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-vf', 'scale=780:-2', '-movflags', '+faststart', path.join(outDir, 'demo.mp4')], {stdio: 'ignore'});
  for (const f of fs.readdirSync(outDir)) if (f.startsWith('f') && f.endsWith('.png')) fs.unlinkSync(path.join(outDir, f));
  console.log('demo.gif and demo.mp4 written (ffmpeg)');
} catch { console.log('ffmpeg not found; frames kept as PNG'); }
