#!/usr/bin/env node
// Static release audit: manifest hashes, directory boundary, forbidden files, high-confidence sensitive markers.
// Exit 0 means only these static checks passed. It does not prove facts, visuals, network access or free-text privacy.
import path from 'node:path';
import {ROOT, arg, flag} from './lib/paths.mjs';
import {audit} from './lib/release.mjs';

const positional = process.argv.slice(2).filter((a, i, arr) => !a.startsWith('--') && !(arr[i - 1] || '').startsWith('--'));
const root = path.resolve(ROOT, positional[0] || 'dist');
const manifest = path.resolve(ROOT, arg('--manifest') || path.join('artifacts', 'manifest.json'));
const result = audit(root, manifest);
if (flag('--json')) console.log(JSON.stringify(result, null, 2));
else {
  console.log('Release static audit:', result.status.toUpperCase());
  console.log('Files:', result.checked_files, '/', result.declared_files, '| bytes:', result.total_bytes);
  for (const e of result.errors) console.log(`- ${e.code}: ${e.path} | ${e.detail}`);
  console.log('Not checked:');
  for (const item of result.not_checked) console.log('-', item);
}
process.exit(result.status === 'passed' ? 0 : 1);
