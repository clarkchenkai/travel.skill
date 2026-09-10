import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../template/app.js',import.meta.url),'utf8');
const init=source.slice(source.indexOf('async function init() {'),source.indexOf('// Offline:'));
test('loading remains visible while an extension loads and clears only once navigation works',async()=>{
 let release,entered,events=false,routed=false;
 const waiting=new Promise(resolve=>entered=resolve);
 const moduleReady=new Promise(resolve=>release=resolve);
 const status={hidden:false},sources={};
 const context={
  $:selector=>selector==='#page-status'?status:sources,
  document:{documentElement:{dataset:{}}},
  loadJSON:async file=>file==='travel-data.json'?{trip:{id:'test'},days:[]}:{transport:{}},
  resolveRentalDays:data=>data.days,getState:()=>({}),
  initModules:async()=>{entered();await moduleReady;},
  initEvents:()=>{events=true;},route:()=>{assert.equal(events,true);routed=true;},
  E:x=>x,t:x=>x,clearInterval:()=>{},setInterval:()=>0,clockTimer:0,
 };
 for(const name of ['renderNav','renderHome','renderMap','renderDays','renderTransport','renderChecklist','initParallax','initMotion','updateClocks','initOffline','initPrint'])context[name]=()=>{};
 vm.createContext(context);
 const pending=vm.runInContext(init+'\ninit()',context);
 await waiting;
 assert.equal(status.hidden,false,'must not announce readiness before delayed module completion');
 assert.equal(events,false);
 release();await pending;
 assert.equal(routed,true);assert.equal(status.hidden,true);
});
