#!/usr/bin/env node
// Validate a trip's travel-data.json: structure, references, times, privacy markers.
import path from 'node:path';
import fs from 'node:fs';
import {tripDir, readJSON, flag} from './lib/paths.mjs';
import {validateTravelData} from './lib/validate.mjs';

const dir = tripDir();
const file = path.join(dir, 'travel-data.json');
if (!fs.existsSync(file)) {
  console.error(`No travel-data.json in ${dir}\nStart from an example:  npm run new -- japan-hiking`);
  process.exit(2);
}
let data;
try { data = readJSON(file); } catch (e) { console.error(`${file}: not valid JSON (${e.message})`); process.exit(2); }
const {errors, warnings} = validateTravelData(data);
if (flag('--json')) { console.log(JSON.stringify({file, errors, warnings}, null, 2)); process.exit(errors.length ? 1 : 0); }
console.log(`Validating ${path.relative(process.cwd(), file)}`);
for (const w of warnings) console.log(`  warn  ${w.path}: ${w.msg}`);
for (const e of errors) console.log(`  ERROR ${e.path}: ${e.msg}`);
console.log(errors.length ? `${errors.length} error(s), ${warnings.length} warning(s).` : `OK — ${warnings.length} warning(s). Structure and references check out; facts still need a human.`);
process.exit(errors.length ? 1 : 0);
