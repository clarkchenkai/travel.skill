import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {inflateRawSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../scripts/lib/paths.mjs';
import {crc32,zip} from '../scripts/lib/zip.mjs';
function unzip(buffer){const files=new Map();let offset=0;while(buffer.readUInt32LE(offset)===0x04034b50){const size=buffer.readUInt32LE(offset+18),nameLength=buffer.readUInt16LE(offset+26),extra=buffer.readUInt16LE(offset+28),name=buffer.subarray(offset+30,offset+30+nameLength).toString(),start=offset+30+nameLength+extra,data=inflateRawSync(buffer.subarray(start,start+size));assert.equal(crc32(data),buffer.readUInt32LE(offset+14));assert.ok(!path.isAbsolute(name)&&!name.split('/').includes('..'));files.set(name,data);offset=start+size;}return files;}
test('ZIP output has correct CRC and supports UTF-8 paths',()=>{assert.equal(crc32(Buffer.from('123456789')),0xcbf43926);const files=unzip(zip([['说明.md','文字'],['file.txt','hello']]));assert.equal(files.get('说明.md').toString(),'文字');assert.equal(files.get('file.txt').toString(),'hello');});
test('all agent downloads contain canonical skills and an extracted workspace can build independently',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'travel-bundle-')),out=path.join(temp,'downloads');
 execFileSync(process.execPath,[path.join(ROOT,'scripts/package-agents.mjs'),'--out',out],{stdio:'pipe'});
 const index=JSON.parse(fs.readFileSync(path.join(out,'index.json')));assert.equal(index.length,4);
 let generic;
 for(const item of index){const files=unzip(fs.readFileSync(path.join(out,item.file)));assert.ok(files.has(item.entry));for(const skill of ['travel-management','travel-product-studio','design-with-ai','travel-template-studio','travel-verification'])assert.ok(files.has(`skills/${skill}/SKILL.md`));
  for(const name of files.keys())assert.ok(!/(^|\/)(node_modules|input|trip|artifacts|\.env|\.git)(\/|$)/.test(name),name);
  assert.equal(files.has('showcase/kumano-kodo/TRIP.md'),false);
  if(item.kind!=='repository')assert.equal([...files.keys()].some(name=>name.startsWith('showcase/')),false);
  if(item.kind==='codex')assert.ok(files.has('.agents/skills/travel-management/SKILL.md'));
  if(item.kind==='claude')assert.ok(files.has('.claude/skills/travel-management/SKILL.md'));
  if(item.kind==='generic')generic=files;
 }
 const extracted=path.join(temp,'extracted');for(const [name,data]of generic){const file=path.join(extracted,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);}
 assert.match(execFileSync(process.execPath,[path.join(extracted,'scripts/check-bundle.mjs')],{encoding:'utf8'}),/PASSED/);
 const trip=path.join(temp,'my-trip');execFileSync(process.execPath,[path.join(extracted,'scripts/new-trip.mjs'),'business-trip','--trip',trip],{stdio:'pipe'});
 execFileSync(process.execPath,[path.join(extracted,'scripts/build.mjs'),'--trip',trip,'--out',path.join(temp,'site'),'--manifest',path.join(temp,'manifest.json')],{stdio:'pipe'});
 assert.ok(fs.existsSync(path.join(temp,'site/modules/business.mjs')));
});
