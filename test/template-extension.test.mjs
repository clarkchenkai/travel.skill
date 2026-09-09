import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {ROOT} from '../scripts/lib/paths.mjs';
import {resolveFile} from '../scripts/serve.mjs';
const run=(script,...args)=>execFileSync(process.execPath,[path.join(ROOT,'scripts',script),...args],{encoding:'utf8'});
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'travel-template-'));
test('clone and template fork stay portable and preserve extra source files',()=>{
 const root=temp(),trip=path.join(root,'journey'),clone=path.join(root,'second');
 run('new-trip.mjs','--from',path.join(ROOT,'examples/business-trip'),'--trip',trip);
 const data=JSON.parse(fs.readFileSync(path.join(trip,'travel-data.json')));assert.notEqual(data.trip.id,'demo-business-london');
 assert.ok(fs.existsSync(path.join(trip,'template/validate.mjs')));
 const out=path.join(root,'out');run('build.mjs','--trip',trip,'--out',out,'--manifest',path.join(root,'m.json'));
 assert.ok(fs.existsSync(path.join(out,'modules/business.mjs')));assert.match(fs.readFileSync(path.join(out,'sw.js'),'utf8'),/modules\/business\.mjs/);
 fs.writeFileSync(path.join(trip,'private-business.md'),'PRIVATE_NOT_FOR_WEB');
 assert.equal(resolveFile('/private-business.md',{tripRoot:trip}),null);
 run('new-trip.mjs','--from',trip,'--trip',clone);assert.equal(fs.existsSync(path.join(clone,'private-business.md')),false);
 assert.notEqual(JSON.parse(fs.readFileSync(path.join(clone,'travel-data.json'))).trip.id,data.trip.id);
});
test('a new editable template previews the same CSS that it builds',()=>{
 const root=temp(),trip=path.join(root,'trip');run('new-trip.mjs','europe-rail','--trip',trip);run('fork-template.mjs','--trip',trip);
 fs.appendFileSync(path.join(trip,'template/themes.css'),'\n:root{--extension-test:1}');
 assert.equal(resolveFile('/themes.css',{tripRoot:trip}),fs.realpathSync(path.join(trip,'template/themes.css')));
 run('build.mjs','--trip',trip,'--out',path.join(root,'out'),'--manifest',path.join(root,'m.json'));
 assert.match(fs.readFileSync(path.join(root,'out/themes.css'),'utf8'),/extension-test/);
 assert.notEqual(spawnSync(process.execPath,[path.join(ROOT,'scripts/fork-template.mjs'),'--trip',trip]).status,0);
});
test('blank creation keeps unknown facts and refuses a premature production build',()=>{
 const root=temp(),trip=path.join(root,'trip');run('new-trip.mjs','--blank','--trip',trip);const d=JSON.parse(fs.readFileSync(path.join(trip,'travel-data.json')));
 assert.equal(d.trip.startDate,null);assert.equal(d.trip.people,null);assert.deepEqual(d.flightJourneys,[]);
 assert.notEqual(spawnSync(process.execPath,[path.join(ROOT,'scripts/build.mjs'),'--trip',trip,'--out',path.join(root,'out')]).status,0);
});
test('custom business validation runs during build and rejects private fields',()=>{
 const root=temp(),trip=path.join(root,'trip');run('new-trip.mjs','--from',path.join(ROOT,'examples/business-trip'),'--trip',trip);
 const f=path.join(trip,'travel-data.json'),d=JSON.parse(fs.readFileSync(f));d.business.privateContact='not-for-publication';fs.writeFileSync(f,JSON.stringify(d));
 const result=spawnSync(process.execPath,[path.join(ROOT,'scripts/build.mjs'),'--trip',trip,'--out',path.join(root,'out')]);assert.notEqual(result.status,0);assert.equal(fs.existsSync(path.join(root,'out/travel-data.json')),false);
});
test('a configured module cannot silently disappear from the package',()=>{
 const root=temp(),trip=path.join(root,'trip');run('new-trip.mjs','europe-rail','--trip',trip);const f=path.join(trip,'travel-data.json'),d=JSON.parse(fs.readFileSync(f));d.ui={modules:[{id:'custom','source':'modules/custom.mjs'}]};fs.writeFileSync(f,JSON.stringify(d));
 assert.notEqual(spawnSync(process.execPath,[path.join(ROOT,'scripts/build.mjs'),'--trip',trip,'--out',path.join(root,'out')]).status,0);
});
test('template declarations reject path traversal and symlink escape',()=>{
 const root=temp(),trip=path.join(root,'trip');run('new-trip.mjs','europe-rail','--trip',trip);run('fork-template.mjs','--trip',trip);
 const f=path.join(trip,'template/manifest.json'),m=JSON.parse(fs.readFileSync(f));m.files.push('../private.md');fs.writeFileSync(f,JSON.stringify(m));
 assert.notEqual(spawnSync(process.execPath,[path.join(ROOT,'scripts/build.mjs'),'--trip',trip,'--out',path.join(root,'out')]).status,0);
 m.files.pop();m.files.push('outside.txt');fs.writeFileSync(f,JSON.stringify(m));fs.writeFileSync(path.join(root,'outside.txt'),'not public');fs.symlinkSync(path.join(root,'outside.txt'),path.join(trip,'template/outside.txt'));
 assert.notEqual(spawnSync(process.execPath,[path.join(ROOT,'scripts/build.mjs'),'--trip',trip,'--out',path.join(root,'out')]).status,0);
});
test('validation rejects missing language packs and undeclared import dependencies',()=>{
 const root=temp(),trip=path.join(root,'trip');run('new-trip.mjs','europe-rail','--trip',trip);run('fork-template.mjs','--trip',trip);
 const f=path.join(trip,'travel-data.json'),data=JSON.parse(fs.readFileSync(f));data.ui={localePack:'fr'};fs.writeFileSync(f,JSON.stringify(data));
 let result=spawnSync(process.execPath,[path.join(ROOT,'scripts/validate.mjs'),'--trip',trip,'--json'],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stdout,/i18n\/fr.json/);
 delete data.ui;fs.writeFileSync(f,JSON.stringify(data));const m=path.join(trip,'template/manifest.json');fs.writeFileSync(m,JSON.stringify({files:['index.html','styles.css','sw.js','app.js','i18n/en.json']}));
 result=spawnSync(process.execPath,[path.join(ROOT,'scripts/build.mjs'),'--trip',trip,'--out',path.join(root,'out')],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/imports undeclared file/);
});
test('declared regional locale automatically selects its language pack in a built trip',()=>{
 const root=temp(),trip=path.join(root,'trip');run('new-trip.mjs','europe-rail','--trip',trip);run('fork-template.mjs','--trip',trip);
 const file=path.join(trip,'travel-data.json'),data=JSON.parse(fs.readFileSync(file));data.trip.locale='fr-CA';delete data.ui?.localePack;fs.writeFileSync(file,JSON.stringify(data));
 const manifestFile=path.join(trip,'template/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile));manifest.files.push('i18n/fr.json');fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 const pack=JSON.parse(fs.readFileSync(path.join(trip,'template/i18n/en.json')));pack.nav.home='Accueil';fs.writeFileSync(path.join(trip,'template/i18n/fr.json'),JSON.stringify(pack));
 const out=path.join(root,'out');run('build.mjs','--trip',trip,'--out',out,'--manifest',path.join(root,'m.json'));
 assert.equal(JSON.parse(fs.readFileSync(path.join(out,'travel-data.json'))).ui.localePack,'fr');
 assert.match(fs.readFileSync(path.join(out,'index.html'),'utf8'),/Accueil/);
 assert.equal(JSON.parse(fs.readFileSync(file)).ui?.localePack,undefined);
});
