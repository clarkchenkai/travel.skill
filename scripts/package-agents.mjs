#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,arg} from './lib/paths.mjs';
import {zip} from './lib/zip.mjs';
const out=path.resolve(ROOT,arg('--out')||'artifacts/downloads');fs.mkdirSync(out,{recursive:true});
const roots=['AGENTS.md','CLAUDE.md','AGENT.md','GEMINI.md','PRODUCT.md','README.md','README.zh-CN.md','LICENSE','CONTRIBUTING.md','package.json','.gitignore','skill','skills','template','examples','scripts','test','evals','docs','site','showcase','.github'];
const excluded=new Set(['node_modules','input','trip','dist','site-dist','artifacts','__pycache__','.git','.DS_Store']);
function collect(relative,entries){const file=path.join(ROOT,relative),stat=fs.lstatSync(file);if(stat.isSymbolicLink())return;if(stat.isDirectory()){for(const name of fs.readdirSync(file).sort())if(!excluded.has(name)&&!/^\.env(?:\.|$)/.test(name)&&!name.endsWith('.pyc'))collect(path.posix.join(relative,name),entries);}else entries.push([relative,fs.readFileSync(file)]);}
const base=[];for(const root of roots)if(fs.existsSync(path.join(ROOT,root)))collect(root,base);
const versions=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8')).version,index=[];
for(const [kind,discovery,entry]of [['repository',['.agents','.claude'],'AGENTS.md'],['codex',['.agents'],'AGENTS.md'],['claude',['.claude'],'CLAUDE.md'],['generic',[],'AGENT.md']]){
 const full=kind==='repository';
 const files=base.filter(([name])=>name!=='showcase/kumano-kodo/TRIP.md' && (full||(!name.startsWith('showcase/')&&name!=='test/showcase-quality.test.mjs'))).map(([name,data])=>{
   if(!full&&name==='.github/workflows/ci.yml')data=Buffer.from(data.toString().split('\n  showcase:')[0]+'\n');
   if(name.endsWith('.md'))data=Buffer.from(data.toString().replace(/\[([^\]]*)\]\(([^)]+)\)/g,(all,label,target)=>{if(/^(?:https?:|#)/.test(target))return all;const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(name),target));if((!full&&resolved.startsWith('showcase/'))||resolved==='showcase/kumano-kodo/TRIP.md')return `[${label}](https://github.com/clarkchenkai/travel.skill/blob/main/${encodeURI(resolved==='showcase/kumano-kodo/TRIP.md'?'showcase/kumano-kodo/SOURCE.md':resolved)})`;return all;}));
   return [name,data];
 });
 for(const folder of discovery)for(const name of fs.readdirSync(path.join(ROOT,'skills')).sort()){const source=path.join(ROOT,'skills',name,'SKILL.md');if(!fs.existsSync(source)||fs.lstatSync(path.dirname(source)).isSymbolicLink())continue;const front=fs.readFileSync(source,'utf8').match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0];if(!front)throw new Error(`Missing skill metadata: ${name}`);files.push([`${folder}/skills/${name}/SKILL.md`,Buffer.from(`${front}\n\nRead and follow [the canonical skill](../../../skills/${name}/SKILL.md). The repository root contains its commands, templates and shared AGENTS.md rules.\n`)]);}
 const includesShowcase=files.some(([name])=>name.startsWith('showcase/'));
 const manifest={version:versions,kind,entry,includesShowcase,files:Object.fromEntries(files.map(([name,data])=>[name,crypto.createHash('sha256').update(data).digest('hex')]))};
 files.push(['bundle-manifest.json',JSON.stringify(manifest,null,2)+'\n']);
 files.push(['BUNDLE.md',`# Travel ${kind} workspace\n\nExtract the whole archive, open its root in your agent, and read ${entry}. The five canonical skills are in skills/. Do not move only a wrapper folder: its relative links require this workspace.\n\nCheck: npm run bundle:check\nStart: npm run new -- business-trip (or another example), then npm run dev.\nCustomize: npm run template -- --trip trip\n\nNo credentials, raw input, author working notes or installed dependencies are included. Agent-specific kits omit the author trip; the full source archive includes the already-public showcase only when present in this workspace. Source templates contain executable code; inspect unfamiliar modifications before running.\n`]);
 const name=`travel-${kind}.zip`,buffer=zip(files.sort(([a],[b])=>a.localeCompare(b)));fs.writeFileSync(path.join(out,name),buffer);index.push({kind,includesShowcase,file:name,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),version:versions,entry,files:files.length});
}
fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(index,null,2)+'\n');console.log(JSON.stringify(index,null,2));
