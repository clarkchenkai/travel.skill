#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,arg} from './lib/paths.mjs';
import {localFile} from './lib/templates.mjs';
const root=path.resolve(arg('--dir')||ROOT),manifest=JSON.parse(fs.readFileSync(path.join(root,'bundle-manifest.json'),'utf8')),errors=[];
for(const [name,hash]of Object.entries(manifest.files||{})){try{if(crypto.createHash('sha256').update(fs.readFileSync(localFile(root,name))).digest('hex')!==hash)errors.push(name);}catch{errors.push(name);}}
if(!Object.keys(manifest.files||{}).length)errors.push('empty manifest');
console.log(errors.length?`Bundle check FAILED: ${errors.join(', ')}`:`Bundle check PASSED: ${Object.keys(manifest.files).length} source files; entry ${manifest.entry}`);process.exit(errors.length?1:0);
