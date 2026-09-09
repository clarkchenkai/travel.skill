#!/usr/bin/env node
// Give one trip its own editable renderer; no global template mutation.
import fs from 'node:fs';
import path from 'node:path';
import {tripDir,arg} from './lib/paths.mjs';
import {selectTemplate,localFile,templateFile} from './lib/templates.mjs';
const trip=tripDir(), destination=path.join(trip,'template');
if (fs.existsSync(destination)) { console.error('This trip already has a template. Edit it in place or choose another trip directory.'); process.exit(1); }
const source=selectTemplate(trip,arg('--from'));
fs.mkdirSync(destination,{recursive:true});
for (const file of [...new Set([...source.files,...(source.validation?[source.validation]:[])])]) {const target=path.join(destination,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync((file===source.validation?localFile(source.root,file):templateFile(source,file)),target);}
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify({files:source.files,...(source.validation?{validation:source.validation}:{})},null,2)+'\n');
console.log(`Editable template: ${destination}\nAdd new page/module source files to template/manifest.json. Preview and build use this template automatically.`);
