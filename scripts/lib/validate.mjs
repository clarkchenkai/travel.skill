import {validDate as rentalDate,validTime,validZone as rentalZone,endpointInstant,endpointCalendar} from '../../template/rental.mjs';
// Structural validation of travel-data.json plus a gap report. Pure functions; no I/O.
const ISO_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const STATUS = new Set(['unknown', 'needs-confirmation', 'booked', 'demo']);
const DOCUMENT_STATUS = new Set(['unknown','needs-confirmation','required','not-required','applied','issued','expired','demo']);
const THEMES = new Set(['field-notes', 'timetable', 'tide']);
const SENSITIVE_KEYS = new Set(['privatedata', 'passportnumber', 'passportno', 'idcardnumber', 'bookingpin', 'pnr', 'eticketnumber', 'apikey', 'accesstoken', 'refreshtoken', 'password', 'secretkey', 'cardnumber', 'confirmationcode', 'bookingreference']);
const SECRET_MARKER = /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/;

export function validateTravelData(data) {
  const errors = [], warnings = [];
  const err = (path, msg) => errors.push({path, msg});
  const warn = (path, msg) => warnings.push({path, msg});
  const text=(v,p)=>{if(v!=null&&typeof v!=='string')err(p,'text or null required');};
  const textList=(v,p)=>{if(v!=null&&(!Array.isArray(v)||v.some(x=>typeof x!=='string')))err(p,'array of text required');};
  if (!data || typeof data !== 'object') { err('$', 'travel-data.json must be a JSON object'); return {errors, warnings}; }
  for(const key of ['places','tickets','sources','accommodations','days','checklist','flightJourneys'])if(data[key]!=null&&!Array.isArray(data[key]))err(key,'array required');
  if(data.rental!=null&&(typeof data.rental!=='object'||Array.isArray(data.rental)))err('rental','object or null required');
  if(data.groundTransport?.tabs!=null&&!Array.isArray(data.groundTransport.tabs))err('groundTransport.tabs','array required');
  if(data.ui?.modules!=null&&!Array.isArray(data.ui.modules))err('ui.modules','array required');
  if(data.rental?.conditions!=null&&!Array.isArray(data.rental.conditions))err('rental.conditions','array required');
  if(data.rental?.eligibility?.documents!=null&&!Array.isArray(data.rental.eligibility.documents))err('rental.eligibility.documents','array required');
  if(errors.length)return {errors,warnings};
  const trip = data.trip || {};
  if (typeof trip.id!=='string' || !trip.id || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(trip.id)) err('trip.id', 'required; lowercase letters, digits and dashes (it namespaces browser storage)');
  if(trip.people!=null&&(!Number.isInteger(trip.people)||trip.people<1))err('trip.people','positive traveler count or null required');
  for(const key of ['title','subtitle','shortTitle','eyebrow','locale'])text(trip[key],'trip.'+key);
  if (!trip.title) err('trip.title', 'required');
  if (!rentalDate(trip.startDate)) err('trip.startDate', 'YYYY-MM-DD required');
  if (!rentalDate(trip.endDate)) err('trip.endDate', 'YYYY-MM-DD required');
  if (typeof trip.startDate==='string' && typeof trip.endDate==='string' && trip.endDate < trip.startDate) err('trip.endDate', 'ends before it starts');
  if (!trip.timeZone) err('trip.timeZone', 'IANA time zone required (e.g. Europe/Paris)');
  else if (!validZone(trip.timeZone)) err('trip.timeZone', `unknown IANA zone "${trip.timeZone}"`);
  if (trip.theme && !THEMES.has(trip.theme)) warn('trip.theme', `"${trip.theme}" is not a built-in theme (${[...THEMES].join(', ')}); add a [data-theme] block in themes.css`);
  if(trip.locale){try{new Intl.DateTimeFormat(trip.locale);}catch{err('trip.locale','valid language tag required');}}
  if(trip.dir&&!['ltr','rtl'].includes(trip.dir))err('trip.dir','ltr or rtl required');
  if(data.ui?.localePack&&!/^[A-Za-z0-9-]+$/.test(data.ui.localePack))err('ui.localePack','language pack filename without path or extension required');
  if (trip.map?.provider && !['google', 'osm', 'none'].includes(trip.map.provider)) err('trip.map.provider', 'google | osm | none');

  const moduleIds=new Set(['home','map','days','transport','checklist']);
  for(const [i,m] of (data.ui?.modules||[]).entries()){if(!m||!/^[a-z][a-z0-9-]*$/.test(m.id||'')||moduleIds.has(m.id))err(`ui.modules[${i}].id`,'unique non-reserved page id required');moduleIds.add(m?.id);if(!/^modules\/[a-zA-Z0-9_/-]+\.mjs$/.test(m?.source||'')||m.source.includes('..'))err(`ui.modules[${i}].source`,'local modules/name.mjs path required');}

  const ids = (list, name) => {
    const seen = new Set();
    for (const [i, item] of (list || []).entries()) {
      if (!item || typeof item.id !== 'string' || !item.id) err(`${name}[${i}].id`, 'required string');
      else if (seen.has(item.id)) err(`${name}[${i}].id`, `duplicate id "${item.id}"`);
      seen.add(item?.id);
    }
    return seen;
  };
  const beforeIds=errors.length;
  const placeIds = ids(data.places, 'places');
  const ticketIds = ids(data.tickets, 'tickets');
  const sourceIds = ids(data.sources, 'sources');
  const stayIds = ids(data.accommodations, 'accommodations');
  ids(data.days, 'days'); ids(data.checklist, 'checklist'); ids(data.flightJourneys, 'flightJourneys');
  if(errors.length>beforeIds)return {errors,warnings};

  const refs = (list, path, pool, label) => { if(list!=null&&!Array.isArray(list)){err(path,'array required');return;} for (const id of list || []) if (!pool.has(id)) err(path, `unknown ${label} "${id}"`); };
  const statusOf = (item, path) => { if (item.status !== undefined && !STATUS.has(item.status)) err(path + '.status', `unknown | needs-confirmation | booked | demo (got "${item.status}")`); };

  for (const [i, p] of (data.places || []).entries()) {
    const path = `places[${i}]`;
    for(const key of ['name','localName','address','note'])text(p[key],path+'.'+key);
    if (!p.name) err(path + '.name', 'required');
    if ((p.lat === undefined) !== (p.lon === undefined)) err(path, 'lat and lon must both be set or both omitted');
    if (p.lat !== undefined && (typeof p.lat !== 'number' || typeof p.lon !== 'number' || Math.abs(p.lat) > 90 || Math.abs(p.lon) > 180)) err(path, 'lat/lon out of range');
    refs(p.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  for (const [i, j] of (data.flightJourneys || []).entries()) {
    const path = `flightJourneys[${i}]`;
    statusOf(j, path);textList(j.notes,path+'.notes');
    if (!Array.isArray(j.segments) || !j.segments.length) { err(path + '.segments', 'at least one segment'); continue; }
    for (const [k, s] of j.segments.entries()) {
      const sp = `${path}.segments[${k}]`;
      if(!s||typeof s!=='object'){err(sp,'segment object required');continue;}
      for (const end of ['origin', 'destination']) {
        if (!s[end]?.code) err(`${sp}.${end}.code`, 'airport/station code required');
        if (!s[end]?.timeZone) err(`${sp}.${end}.timeZone`, 'IANA zone required');
        else if (!validZone(s[end].timeZone)) err(`${sp}.${end}.timeZone`, `unknown zone "${s[end].timeZone}"`);
      }
      if (typeof s.departure!=='string' || !ISO_OFFSET.test(s.departure || '') || !rentalDate(s.departure?.slice(0,10)) || !validTime(s.departure?.slice(11,16)) || !Number.isFinite(Date.parse(s.departure))) err(sp + '.departure', 'ISO time with offset required, e.g. 2031-04-01T10:00:00+08:00');
      if (typeof s.arrival!=='string' || !ISO_OFFSET.test(s.arrival || '') || !rentalDate(s.arrival?.slice(0,10)) || !validTime(s.arrival?.slice(11,16)) || !Number.isFinite(Date.parse(s.arrival))) err(sp + '.arrival', 'ISO time with offset required');
      if (typeof s.departure==='string' && typeof s.arrival==='string' && ISO_OFFSET.test(s.departure) && ISO_OFFSET.test(s.arrival) && Date.parse(s.arrival) < Date.parse(s.departure)) err(sp, 'arrives before departure (compare absolute instants, not clock faces)');
      if (k > 0 && typeof s.departure==='string' && typeof j.segments[k - 1]?.arrival==='string' && Date.parse(s.departure) < Date.parse(j.segments[k - 1].arrival)) err(sp, 'connection departs before previous segment arrives');
    }
    refs(j.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  for (const [i, a] of (data.accommodations || []).entries()) {
    const path = `accommodations[${i}]`;
    for(const key of ['name','localName','note'])text(a[key],path+'.'+key);
    if (!a.name) err(path + '.name', 'required');
    statusOf(a, path);
    if (a.placeId && !placeIds.has(a.placeId)) err(path + '.placeId', `unknown place "${a.placeId}"`);
    if (a.checkIn && !rentalDate(a.checkIn)) err(path + '.checkIn', 'YYYY-MM-DD');
    if (a.checkOut && !rentalDate(a.checkOut)) err(path + '.checkOut', 'YYYY-MM-DD');
    if(a.checkIn&&a.checkOut&&a.checkOut<a.checkIn)err(path+'.checkOut','check-out before check-in');
    refs(a.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  const dates = new Set(), rentalRefs=new Set();
  for (const [i, d] of (data.days || []).entries()) {
    const path = `days[${i}]`;
    if (!rentalDate(d.date)) err(path + '.date', 'YYYY-MM-DD');
    else {
      if (dates.has(d.date)) err(path + '.date', `duplicate day ${d.date}`);
      dates.add(d.date);
      if (trip.startDate && (d.date < trip.startDate || d.date > trip.endDate)) err(path + '.date', 'outside trip dates');
    }
    if (!d.title) err(path + '.title', 'required');
    if (d.accommodationId && !stayIds.has(d.accommodationId)) err(path + '.accommodationId', `unknown accommodation "${d.accommodationId}"`);
    if (!Array.isArray(d.events)) err(path + '.events', 'array required');
    const eventIds = new Set();
    for (const [k, e] of (Array.isArray(d.events)?d.events:[]).entries()) {
      const ep = `${path}.events[${k}]`;
      if(!e||typeof e!=='object'){err(ep,'event object required');continue;}
      if (!e.id) err(ep + '.id', 'required'); else if (eventIds.has(e.id)) err(ep + '.id', 'duplicate'); eventIds.add(e.id);
      for(const key of ['title','timeLabel','notes'])text(e[key],ep+'.'+key);textList(e.details,ep+'.details');
      if (!e.title) err(ep + '.title', 'required');
      refs(e.placeIds, ep + '.placeIds', placeIds, 'place');
      refs(e.ticketIds, ep + '.ticketIds', ticketIds, 'ticket');
      refs(e.sourceRefs, ep + '.sourceRefs', sourceIds, 'source');
      statusOf(e, ep);
      if(e.rentalRef&&rentalRefs.has(e.rentalRef))err(ep+'.rentalRef','duplicate rental endpoint reference');
      if(e.rentalRef)rentalRefs.add(e.rentalRef);
      if(e.rentalRef && (!data.rental || !['pickUp','dropOff'].includes(e.rentalRef)))err(ep+'.rentalRef','pickUp or dropOff requires rental data');
    }
  }
  if (trip.startDate && trip.endDate && rentalDate(trip.startDate) && rentalDate(trip.endDate)) {
    for (let t = Date.parse(trip.startDate + 'T00:00:00Z'); t <= Date.parse(trip.endDate + 'T00:00:00Z'); t += 86400000) {
      const ymd = new Date(t).toISOString().slice(0, 10);
      if (!dates.has(ymd)) warn('days', `no day entry for ${ymd}`);
    }
  }
  for (const [i, tk] of (data.tickets || []).entries()) {
    const path = `tickets[${i}]`;
    if (!tk.title) err(path + '.title', 'required');
    statusOf(tk, path);
    if (tk.placeId && !placeIds.has(tk.placeId)) err(path + '.placeId', `unknown place "${tk.placeId}"`);
    if (tk.price !== undefined && tk.price !== null && (typeof tk.price.amount !== 'number' || !/^[A-Z]{3}$/.test(tk.price.currency || ''))) err(path + '.price', '{amount:number, currency:"ISO 4217"} or null');
    refs(tk.sourceRefs, path + '.sourceRefs', sourceIds, 'source');
  }
  for (const [i, c] of (data.checklist || []).entries()) {
    if (!c.text) err(`checklist[${i}].text`, 'required');
    if (c.group && !['todo', 'packing'].includes(c.group)) err(`checklist[${i}].group`, 'todo | packing');
  }
  for (const [i, tab] of (data.groundTransport?.tabs || []).entries()) {
    if(!tab||typeof tab!=='object'){err(`groundTransport.tabs[${i}]`,'tab object required');continue;}
    if (!tab.id || !tab.title) err(`groundTransport.tabs[${i}]`, 'id and title required');
    if(tab.items!=null&&!Array.isArray(tab.items))err(`groundTransport.tabs[${i}].items`,'array required');
    for (const [k, item] of (Array.isArray(tab.items)?tab.items:[]).entries()) {if(!item||typeof item!=='object'){err(`groundTransport.tabs[${i}].items[${k}]`,'item object required');continue;}refs(item.placeIds, `groundTransport.tabs[${i}].items[${k}].placeIds`, placeIds, 'place');}
  }
  if (data.rental) {
    statusOf(data.rental, 'rental');
    const r=data.rental;
    for(const key of ['vendor','vehicle','coverage','fuelPolicy'])text(r[key],'rental.'+key);textList(r.notes,'rental.notes');
    for (const end of ['pickUp','dropOff']) {
      const e=r[end];if(e===undefined||e===null)continue;
      if(typeof e!=='object'||Array.isArray(e)){err(`rental.${end}`,'endpoint object or null required');continue;}
      for(const key of ['at','date','time','timeZone','placeId','branchName','openingHours','afterHours'])text(e[key],`rental.${end}.${key}`);
      if(e.placeId&&!placeIds.has(e.placeId))err(`rental.${end}.placeId`,'unknown place');
      if(e.date&&!rentalDate(e.date))err(`rental.${end}.date`,'valid calendar date required');
      if(e.time&&!validTime(e.time))err(`rental.${end}.time`,'HH:MM from 00:00 to 23:59 required');
      if(e.timeZone&&!rentalZone(e.timeZone))err(`rental.${end}.timeZone`,'valid IANA time zone required');
      if(e.at&&!endpointInstant(e))err(`rental.${end}.at`,'valid ISO instant with offset required');
      if(!e.at&&e.date&&e.time&&rentalDate(e.date)&&validTime(e.time)&&rentalZone(e.timeZone)&&!endpointInstant(e))err(`rental.${end}`,'ambiguous or nonexistent local time; use an explicit at instant from the source');
      if(e.at&&(e.date||e.time))err(`rental.${end}`,'use at + timeZone OR date + time + timeZone, not duplicate time facts');
      refs(e.sourceRefs,`rental.${end}.sourceRefs`,sourceIds,'source');
      const date=endpointCalendar(e).date;
      if(date&&rentalDate(date)&&!(data.days||[]).some(day=>day.date===date))err(`rental.${end}.date`,'no daily entry for rental endpoint; add the endpoint date to the plan');
      if(date&&trip.startDate&&(date<trip.startDate||date>trip.endDate))err(`rental.${end}`,'endpoint outside trip dates; extend the daily plan');
    }
    const pickup=endpointInstant(r.pickUp),dropoff=endpointInstant(r.dropOff);
    if(pickup&&dropoff&&Date.parse(dropoff)<=Date.parse(pickup))err('rental.dropOff','return must be after pickup');
    if(!pickup||!dropoff){const a=endpointCalendar(r.pickUp),b=endpointCalendar(r.dropOff);if(a.date&&b.date&&a.timeZone===b.timeZone&&`${b.date} ${b.time}`<=`${a.date} ${a.time}`)err('rental.dropOff','return must be after pickup');}
    for(const key of ['deposit','price'])if(r[key]!=null&&(typeof r[key].amount!=='number'||!Number.isFinite(r[key].amount)||r[key].amount<0||!/^[A-Z]{3}$/.test(r[key].currency||'')))err(`rental.${key}`,'amount and ISO currency required');
    for(const [i,c] of (r.conditions||[]).entries()){if(!c||typeof c!=='object'){err(`rental.conditions[${i}]`,'object required');continue;}if(!c.id||!c.title)err(`rental.conditions[${i}]`,'id and title required');statusOf(c,`rental.conditions[${i}]`);refs(c.sourceRefs,`rental.conditions[${i}].sourceRefs`,sourceIds,'source');}
    for(const [i,doc] of (r.eligibility?.documents||[]).entries()){if(!doc||typeof doc!=='object'){err(`rental.eligibility.documents[${i}]`,'object required');continue;}if(!doc.title)err(`rental.eligibility.documents[${i}].title`,'required');if(doc.status!=null&&!DOCUMENT_STATUS.has(doc.status))err(`rental.eligibility.documents[${i}].status`,'unknown, needs-confirmation, required, not-required, applied, issued, expired or demo');
      if(doc.expiresOn&&!rentalDate(doc.expiresOn))err(`rental.eligibility.documents[${i}].expiresOn`,'valid calendar date required');
      if(doc.applicationUrl&&!/^https?:\/\//.test(doc.applicationUrl))err(`rental.eligibility.documents[${i}].applicationUrl`,'absolute official URL or null required');refs(doc.sourceRefs,`rental.eligibility.documents[${i}].sourceRefs`,sourceIds,'source');}
    refs(r.sourceRefs,'rental.sourceRefs',sourceIds,'source');
  }
  scanPrivacy(data, '$', err);
  return {errors, warnings};
}

function scanPrivacy(value, path, err) {
  if (Array.isArray(value)) { value.forEach((v, i) => scanPrivacy(v, `${path}[${i}]`, err)); return; }
  if (value && typeof value === 'object') {
    if (value.privacy === 'private' || value.privacy === 'restricted') err(path + '.privacy', 'private/restricted records must not be in the published data');
    for (const [k, v] of Object.entries(value)) {
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (SENSITIVE_KEYS.has(norm) && v !== null && v !== '' && v !== undefined) err(`${path}.${k}`, 'looks like a credential or booking reference; keep it out of the public file');
      scanPrivacy(v, `${path}.${k}`, err);
    }
    return;
  }
  if (typeof value === 'string' && SECRET_MARKER.test(value)) err(path, 'contains something that looks like an API key or token');
}

function validZone(zone) {
  try { new Intl.DateTimeFormat('en', {timeZone: zone}); return true; } catch { return false; }
}

// Gap report: what a reader would still need to confirm before the roadbook is trustworthy.
export function gapReport(data) {
  const structural=validateTravelData(data).errors;
  if(structural.length)return structural.map(e=>({area:'data',item:e.path,why:e.msg}));
  const gaps = [];
  const add = (area, item, why) => gaps.push({area, item, why});
  const trip = data.trip || {};
  if (!trip.people) add('trip', 'people', 'How many travelers? Affects tickets and stays.');
  if (!trip.subtitle) add('trip', 'subtitle', 'One line that says what this trip is.');
  if (!(data.flightJourneys || []).length) add('flights', 'none listed', 'No flights. Fine for a local trip; otherwise add them or confirm the trip has none.');
  for (const j of data.flightJourneys || []) {
    if (!j.status || j.status === 'unknown') add('flights', j.label || j.id, 'Booking status unknown. Booked, or still to confirm?');
    if (j.status === 'needs-confirmation') add('flights', j.label || j.id, 'Marked as needing confirmation.');
  }
  for (const a of data.accommodations || []) {
    if (!a.status || a.status === 'unknown' || a.status === 'needs-confirmation') add('stays', a.name, 'Booking status not confirmed.');
    if (!a.placeId) add('stays', a.name, 'No place linked, so no map or address.');
  }
  for (const [i, d] of (data.days || []).entries()) {
    if (!d.events?.length) add('days', d.date, 'No activities yet.');
    const overnightTravel = (d.events || []).some((e) => ['flight', 'overnight-train', 'ferry-overnight'].includes(e.kind));
    if (!d.accommodationId && i < (data.days.length - 1) && !overnightTravel) add('days', d.date, 'Where do you sleep this night?');
    for (const e of d.events || []) {
      if (!e.timeLabel) add('days', `${d.date} · ${e.title}`, 'No time or time-of-day label.');
      if (!(e.placeIds || []).length && !['note', 'free', 'rest', 'flight', 'overnight-train', 'ferry-overnight'].includes(e.kind)) add('days', `${d.date} · ${e.title}`, 'No place linked; the reader cannot open a map for it.');
    }
  }
  for (const p of data.places || []) {
    if (p.lat === undefined && !p.mapQuery && !p.mapUrl) add('places', p.name, 'No coordinates, map query or map URL.');
    if (!p.address && !p.localName) add('places', p.name, 'No address or local-language name to copy on site.');
  }
  for (const tk of data.tickets || []) {
    if (!tk.price) add('tickets', tk.title, 'No reference price. Leave null if unknown; never put 0.');
    if (!tk.where) add('tickets', tk.title, 'Where is it bought?');
  }
  if (!(data.checklist || []).length) add('checklist', 'empty', 'No pre-trip items yet.');
  if (!(data.groundTransport?.tabs || []).length) add('transport', 'ground transport', 'No rail/bus/walking/driving notes. Skip if not needed.');
  if (data.rental) {
    const r = data.rental;
    if(!r.vendor)add('rental','vendor','Actual supplier and branch are not yet selected.');
    for(const key of ['pickUp','dropOff']){
      const e=r[key]||{},calendar=endpointCalendar(e);
      if(!calendar.date||!calendar.time)add('rental',key,'Exact local date and time missing.');
      if(!e.timeZone)add('rental',key+'.timeZone','Endpoint IANA time zone missing.');
      if(!e.placeId)add('rental',key+'.placeId','Link the actual branch, not just the airport or booking platform.');
      if(calendar.date&&!(data.days||[]).some(day=>day.date===calendar.date))add('rental',key+'.day','No daily entry for this endpoint; extend the daily plan.');
      if(!e.branchName)add('rental',key+'.branchName','Confirm the actual branch and its entrance/shuttle.');
      if(!e.openingHours)add('rental',key+'.openingHours','Verify branch hours and the planned arrival time.');
      if(!e.afterHours)add('rental',key+'.afterHours','Confirm late pickup / early return and key handover rules, or explicitly mark not applicable.');
    }
    for(const key of ['coverage','fuelPolicy'])if(typeof r[key]!=='string'||!r[key].trim())add('rental',key,'Supplier policy missing.');
    if(!r.deposit||typeof r.deposit.amount!=='number'||!r.deposit.currency)add('rental','deposit','Deposit amount, currency and payment/cardholder requirements need confirmation.');
    if(!r.eligibility?.licenceCountry)add('rental','eligibility.licenceCountry','Where was each driver licence issued? Do not infer permission from the words international licence.');
    if(!r.eligibility?.supplierAcceptance)add('rental','eligibility.supplierAcceptance','Verify law AND the actual supplier accepting each driver and document.');
    if(!r.eligibility?.documents?.length)add('rental','eligibility.documents','List applicable licence/translation/permit requirements and official application routes.');
    for(const doc of r.eligibility?.documents||[]){
      const fields=['issuer','validity','sourceRefs',...(['issued','not-required'].includes(doc.status)?[]:['applicationUrl','materials','processingTime'])];
      for(const key of fields)if(!doc[key]||(Array.isArray(doc[key])&&!doc[key].length))add('rental',`document:${doc.title}:${key}`,'Application detail missing; verify or mark not applicable with a reason.');
      if(doc.status==='expired'||(doc.expiresOn&&doc.expiresOn<(endpointCalendar(r.dropOff).date||trip.endDate)))add('rental',`document:${doc.title}:expiry`,'Document may expire before driving ends; verify before booking.');
    }
    const conditions=new Set((r.conditions||[]).map(c=>c.id));
    for(const [key,needed] of [['payment',true],['inspection',true],['assistance',true],['cross-border',(r.countries||data.trip?.countries||[]).length>1],['child-seat',Boolean(r.childSeatRequired)],['charging',r.energy==='electric']])if(needed&&!conditions.has(key))add('rental',key,'Confirm the applicable supplier rule and source.');
    for(const c of r.conditions||[])if(!c.text||['unknown','needs-confirmation'].includes(c.status)||!c.sourceRefs?.length)add('rental',c.id,'Rule or its evidence remains unverified.');
    if((data.days||[]).some(d=>(d.events||[]).some(e=>e.kind==='rental'&&!e.rentalRef)))add('rental','daily linkage','Tag pickup/return daily entries with rentalRef so changes flow to the daily plan.');
  }
  for (const s of data.sources || []) if (!s.url && s.id !== 'demo' && !s.note) add('sources', s.id, 'No URL or note; where does this fact come from?');
  return gaps;
}
