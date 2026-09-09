import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TEMPLATE = path.join(ROOT, 'template');

// The trip folder holds travel-data.json and optional assets/. Default: ./trip, or --trip <dir>, or TRIP env.
export function tripDir(argv = process.argv.slice(2)) {
  const i = argv.indexOf('--trip');
  const dir = i >= 0 ? argv[i + 1] : process.env.TRIP || 'trip';
  return path.resolve(ROOT, dir);
}
export function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
export function arg(name, argv = process.argv.slice(2)) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; }
export function flag(name, argv = process.argv.slice(2)) { return argv.includes(name); }
