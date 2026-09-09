#!/usr/bin/env node
// Start a trip folder from an example:  npm run new -- japan-hiking [--trip my-trip]
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, tripDir} from './lib/paths.mjs';

const examples = fs.readdirSync(path.join(ROOT, 'examples')).filter((d) => fs.existsSync(path.join(ROOT, 'examples', d, 'travel-data.json')));
const name = process.argv.slice(2).find((a) => !a.startsWith('--') && !examples.includes(a) ? false : examples.includes(a));
const target = tripDir();
if (!name) { console.error(`Usage: npm run new -- <example> [--trip <dir>]\nExamples: ${examples.join(', ')}`); process.exit(2); }
if (fs.existsSync(path.join(target, 'travel-data.json')) && !process.argv.includes('--force')) {
  console.error(`${path.relative(ROOT, target)}/travel-data.json already exists. Add --force to overwrite.`);
  process.exit(1);
}
fs.mkdirSync(target, {recursive: true});
fs.cpSync(path.join(ROOT, 'examples', name), target, {recursive: true, force: true});
console.log(`Copied examples/${name} → ${path.relative(ROOT, target)}/\nNext:  npm run dev   then open http://localhost:4173/\nEdit ${path.relative(ROOT, target)}/travel-data.json; set trip.demo to false once it is your real trip.`);
