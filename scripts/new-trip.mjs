#!/usr/bin/env node
// Start from a bundled example, an existing local trip, or an honest empty draft.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {ROOT,tripDir,arg,flag} from './lib/paths.mjs';
import {localFile,selectTemplate,templateFile} from './lib/templates.mjs';
const examples=fs.readdirSync(path.join(ROOT,'examples')).filter(name=>fs.existsSync(path.join(ROOT,'examples',name,'travel-data.json')));
const args=process.argv.slice(2),positionals=[];
for(let i=0;i<args.length;i++){if(['--trip','--from'].includes(args[i])){i++;continue;}if(!args[i].startsWith('--'))positionals.push(args[i]);}
const name=positionals.find(a=>examples.includes(a));
const from=arg('--from'), blank=flag('--blank'),target=tripDir();
if([Boolean(name),Boolean(from),blank].filter(Boolean).length!==1){console.error(`Choose one: npm run new -- <example> | --from <local-trip> | --blank [--trip <destination>]\nExamples: ${examples.join(', ')}`);process.exit(2);}
if(fs.existsSync(path.join(target,'travel-data.json'))&&!flag('--force')){console.error('travel-data.json already exists; choose another destination or use --force explicitly.');process.exit(1);}
const source=from?path.resolve(ROOT,from):name?path.join(ROOT,'examples',name):null;
if(source&&(target===source||source.startsWith(target+path.sep)||target.startsWith(source+path.sep)))throw new Error('Source and destination must be separate trip directories.');
fs.mkdirSync(target,{recursive:true});
if(blank){
 const id=path.basename(target).toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,64)||'new-trip';
 const data={trip:{id:id.length<2?'new-trip':id,title:'Untitled roadbook',subtitle:'',startDate:null,endDate:null,timeZone:null,locale:'en',theme:'field-notes',people:null,demo:false},places:[],flightJourneys:[],accommodations:[],days:[],tickets:[],checklist:[],sources:[]};
 fs.writeFileSync(path.join(target,'travel-data.json'),JSON.stringify(data,null,2)+'\n');
}else{
 fs.copyFileSync(localFile(source,'travel-data.json'),path.join(target,'travel-data.json'));
 for(const item of ['assets','ASSETS.md','LICENSE'])if(fs.existsSync(path.join(source,item))){const src=path.join(source,item);if(fs.lstatSync(src).isSymbolicLink())throw new Error('Clone regular files, not external links.');fs.cpSync(src,path.join(target,item),{recursive:true,filter:p=>!fs.lstatSync(p).isSymbolicLink()});}
 if(fs.existsSync(path.join(source,'template'))){const selected=selectTemplate(source);for(const file of [...new Set([...selected.files,...(selected.validation?[selected.validation]:[])])]){const dest=path.join(target,'template',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync((file===selected.validation?localFile(selected.root,file):templateFile(selected,file)),dest);}fs.writeFileSync(path.join(target,'template/manifest.json'),JSON.stringify({files:selected.files,...(selected.validation?{validation:selected.validation}:{})},null,2)+'\n');}
}
const createdFile=path.join(target,'travel-data.json');
const created=JSON.parse(fs.readFileSync(createdFile,'utf8'));
created.trip.id=((path.basename(target).toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-+|-+$/g,'')||'trip').slice(0,48))+'-'+randomUUID().slice(0,8);
if(from){const reset=value=>{if(value&&typeof value==='object'){if(value.status==='booked')value.status='needs-confirmation';Object.values(value).forEach(reset);}};reset(created);}
fs.writeFileSync(createdFile,JSON.stringify(created,null,2)+'\n');
console.log(`Trip created: ${target}\nFill unknown dates, places and decisions; run npm run gaps -- --trip <destination>.\nFor new layouts/pages: npm run template -- --trip <destination>, then edit that trip's template.`);
