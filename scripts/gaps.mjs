#!/usr/bin/env node
// Gap report: the questions a reader would still have to ask before trusting this roadbook.
// Agents run this after importing materials and confirm the answers with the traveler.
import path from 'node:path';
import fs from 'node:fs';
import {tripDir, readJSON, flag} from './lib/paths.mjs';
import {gapReport, validateTravelData} from './lib/validate.mjs';

const file = path.join(tripDir(), 'travel-data.json');
if (!fs.existsSync(file)) { console.error(`No travel-data.json in ${tripDir()}`); process.exit(2); }
const data = readJSON(file);
const {errors} = validateTravelData(data);
const gaps = gapReport(data);
if (flag('--json')) { console.log(JSON.stringify({file, structuralErrors: errors, gaps}, null, 2)); process.exit(0); }
if (errors.length) console.log(`Note: ${errors.length} structural error(s) — run npm run validate first.\n`);
if (!gaps.length) { console.log('No gaps found. That means the fields are filled, not that the facts are right.'); process.exit(0); }
let area = '';
for (const g of gaps) {
  if (g.area !== area) { area = g.area; console.log(`\n${area}`); }
  console.log(`  - ${g.item}: ${g.why}`);
}
console.log(`\n${gaps.length} gap(s). Confirm each with the traveler; do not invent times, prices or booking status.`);
