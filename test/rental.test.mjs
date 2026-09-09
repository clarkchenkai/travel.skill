import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateTravelData,gapReport} from '../scripts/lib/validate.mjs';
import {endpointInstant,resolveRentalDays} from '../template/rental.mjs';
const base=()=>JSON.parse(fs.readFileSync(new URL('../examples/family-island/travel-data.json',import.meta.url),'utf8'));
test('empty rental endpoints and documents remain actionable gaps',()=>{
 const d=base();d.rental={pickUp:{},dropOff:{},coverage:{},fuelPolicy:{},deposit:{}};
 assert.ok(validateTravelData(d).errors.length>0); // malformed money is not accepted
 d.rental.deposit=null;d.rental.coverage=null;d.rental.fuelPolicy=null;const gaps=gapReport(d).filter(g=>g.area==='rental');
 for(const key of ['pickUp','dropOff','eligibility.documents','eligibility.licenceCountry','deposit'])assert.ok(gaps.some(g=>g.item===key),key);
});
test('rental clocks reject invalid date, time, timezone and reverse order',()=>{
 const d=base();d.rental.pickUp={date:'2031-02-30',time:'25:99',timeZone:'Not/AZone',placeId:'pmi'};
 const errors=validateTravelData(d).errors;assert.ok(errors.some(e=>e.path.endsWith('.date')));assert.ok(errors.some(e=>e.path.endsWith('.time')));assert.ok(errors.some(e=>e.path.endsWith('.timeZone')));
 d.rental.pickUp={at:'2031-07-10T10:00:00+02:00',timeZone:'Europe/Madrid',placeId:'pmi'};d.rental.dropOff={at:'2031-07-09T10:00:00+02:00',timeZone:'Europe/Madrid',placeId:'pmi'};
 assert.ok(validateTravelData(d).errors.some(e=>e.path==='rental.dropOff'));
});
test('DST folds and skipped times need explicit source offsets',()=>{
 assert.equal(endpointInstant({date:'2027-03-28',time:'02:30',timeZone:'Europe/Paris'}),null);
 assert.equal(endpointInstant({date:'2027-10-31',time:'02:30',timeZone:'Europe/Paris'}),null);
 assert.equal(endpointInstant({at:'2027-10-31T02:30:00+02:00',timeZone:'Europe/Paris'}),'2027-10-31T02:30:00+02:00');
 assert.equal(endpointInstant({date:'2027-06-01',time:'09:00',timeZone:'Asia/Kathmandu'}),'2027-06-01T03:15:00.000Z');
});
test('one endpoint change moves its daily entry, time and map without mutating source',()=>{
 const d=base(),before=JSON.stringify(d);const original=resolveRentalDays(d);
 d.rental.dropOff={at:'2031-07-10T05:00:00+02:00',timeZone:'Europe/Madrid',placeId:'cathedral'};
 const linked=resolveRentalDays(d),events=linked.flatMap(day=>day.events.filter(e=>e.rentalRef==='dropOff').map(e=>({day:day.date,...e})));
 assert.equal(events.length,1);assert.equal(events[0].day,'2031-07-10');assert.match(events[0].timeLabel,/05:00.*Europe\/Madrid/);assert.deepEqual(events[0].placeIds,['cathedral']);
 assert.equal(d.days.at(-1).events.find(e=>e.rentalRef==='dropOff').timeLabel,'15:30');
 assert.equal(original.at(-1).events.filter(e=>e.rentalRef==='dropOff').length,1);
 assert.deepEqual(resolveRentalDays({...d,days:linked}),linked);assert.notEqual(JSON.stringify(d),before);
});
test('eligibility and special rental conditions have gaps; foreign refs are rejected',()=>{
 const d=base();d.rental.energy='electric';d.rental.countries=['CH','FR'];d.rental.childSeatRequired=true;
 const keys=gapReport(d).map(g=>g.item);for(const key of ['charging','cross-border','child-seat','eligibility.documents'])assert.ok(keys.includes(key));
 d.rental.eligibility={documents:[{title:'Permit',sourceRefs:['missing']}]};assert.ok(validateTravelData(d).errors.some(e=>/eligibility/.test(e.path)));
});
test('malformed generated collections produce errors, not validator crashes',()=>{
 for(const mutate of [d=>d.days={},d=>d.days[0].events=[null],d=>d.rental.conditions=[null],d=>d.rental.eligibility={documents:{}},d=>d.groundTransport.tabs=[null]]){
  const d=base();mutate(d);assert.doesNotThrow(()=>validateTravelData(d));assert.ok(validateTravelData(d).errors.length);assert.ok(gapReport(d).length);
 }
});
test('a known rental endpoint must have a day before publication',()=>{
 const d=base();d.rental.dropOff={date:'2031-07-20',time:'05:00',timeZone:'Europe/Madrid',placeId:'pmi'};
 assert.ok(validateTravelData(d).errors.some(e=>e.path.startsWith('rental.dropOff')&&/daily entry|outside trip/.test(e.msg)));
});
test('an unchanged pickup keeps its position before loosely timed afternoon activities',()=>{const d=base(),events=resolveRentalDays(d)[0].events;assert.ok(events.findIndex(e=>e.rentalRef==='pickUp')<events.findIndex(e=>e.id==='d1-drive'));});
test('issued documents use document states and expiry, not booking states',()=>{const d=base();d.rental.eligibility={documents:[{title:'Licence',status:'issued',issuer:'Demo authority',validity:'Illustrative',expiresOn:'2030-01-01',sourceRefs:['demo']}]};assert.equal(validateTravelData(d).errors.length,0);assert.ok(gapReport(d).some(g=>g.item.endsWith(':expiry')));d.rental.eligibility.documents[0].status='booked';assert.ok(validateTravelData(d).errors.some(e=>e.path.endsWith('.status')));});
