import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {countdown,duration,tripStage,nextFlightIndex,pendingTickets,normalizeState,initialState,taskStats,visibleTasks,escapeHTML,safeURL} from './core.mjs';
const data=JSON.parse(readFileSync(new URL('./travel-data.json',import.meta.url),'utf8'));
test('跨时区航程按绝对时刻计算',()=>{
 assert.equal(duration('2026-09-10T09:20:00+08:00','2026-09-10T14:15:00+09:00'),'3小时55分');
 assert.deepEqual(countdown('2026-09-10T09:20:00+08:00',new Date('2026-09-09T01:19:59Z')),{ended:false,days:1,hours:0,minutes:0,seconds:1});
});
test('起飞后不出现负倒计时；错误时间有缺省值',()=>{
 assert.deepEqual(countdown('2026-09-10T09:20:00+08:00',new Date('2026-09-10T02:20:00Z')),{ended:true,days:0,hours:0,minutes:0,seconds:0});
 assert.equal(countdown('invalid'),null);
});
test('日本午夜切换行程日期，旅程结束后单独标记',()=>{
 assert.equal(tripStage(data.trip,new Date('2026-09-09T15:00:00Z')).text,'行程第 1 天');
 assert.equal(tripStage(data.trip,new Date('2026-09-15T15:00:00Z')).kind,'after');
 assert.equal(nextFlightIndex(data.flightJourneys,new Date('2026-09-11T00:00:00Z')),1);
});
test('同一票项在一天重复出现只计一次，跨天共享购买状态',()=>{
 const day={events:[{ticketIds:['nanki','nanki']},{ticketIds:['nanki','other']}]};
 assert.deepEqual(pendingTickets(day,{nanki:true}),['other']);
 assert.equal(pendingTickets(data.days[2],{nanki:true}).length,2);
 assert.equal(pendingTickets(data.days[3],{nanki:true}).length,0);
});
test('损坏或旧格式状态不会生成无效清单',()=>{
 assert.deepEqual(normalizeState(null),initialState());
 const s=normalizeState({tasks:{a:true,b:'true'},addedTasks:[null,{id:'x',text:'a'.repeat(141)},{id:'ok',text:'雨衣',group:'packing'}],deletedTaskIds:[null,1,'a']});
 assert.deepEqual(s.tasks,{a:true});assert.equal(s.addedTasks.length,1);assert.deepEqual(s.deletedTaskIds,['a']);
});
test('已完成事项删除及撤销后的计数正确',()=>{
 const base=[{id:'a',text:'现金',group:'packing'},{id:'b',text:'购票',group:'todo'}];
 const s=normalizeState({tasks:{a:true},deletedTaskIds:['a']});
 assert.deepEqual(taskStats(base,s),{total:1,completed:0});
 s.deletedTaskIds=[];assert.deepEqual(taskStats(base,s),{total:2,completed:1});
 assert.equal(visibleTasks(base,s,'packing').length,1);
});
test('用户自由文本显示为文字，外链拒绝脚本协议',()=>{
 assert.equal(escapeHTML('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
 assert.equal(safeURL('javascript:alert(1)'),'');
 assert.equal(safeURL('https://example.com/'),'https://example.com/');
});
test('完整六日资料引用均能解析，没有空白占位日期',()=>{
 const sources=new Set(data.sources.map(s=>s.id));const places=new Set(data.places.map(p=>p.id));
 assert.equal(data.days.length,6);assert.equal(data.days.flatMap(d=>d.events).length,46);
 for(const day of data.days)for(const event of day.events){
  assert.ok(event.title&&event.timeLabel);for(const id of event.sourceRefs)assert.ok(sources.has(id),id);for(const id of event.placeIds)assert.ok(places.has(id),id);
 }
});
