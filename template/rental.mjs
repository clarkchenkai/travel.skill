// Rental endpoints are facts; all other placements are derived from them.
export function validDate(value) {
  if (typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d=new Date(value+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===value;
}
export const validTime = value => typeof value==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || '');
export function validZone(value) { try { new Intl.DateTimeFormat('en',{timeZone:value}).format(); return typeof value==='string' && value.length>0; } catch { return false; } }
const cache=new Map();
export function endpointInstant(endpoint) {
  if (!endpoint || typeof endpoint!=='object') return null;
  if (endpoint.at) return typeof endpoint.at==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(endpoint.at) && validDate(endpoint.at.slice(0,10)) && validTime(endpoint.at.slice(11,16)) && Number.isFinite(Date.parse(endpoint.at)) ? endpoint.at : null;
  const {date,time,timeZone}=endpoint;
  if (!validDate(date)||!validTime(time)||!validZone(timeZone)) return null;
  const key=JSON.stringify([date,time,timeZone]); if(cache.has(key))return cache.get(key);
  const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const nominal=Date.parse(`${date}T${time}:00Z`), matches=[];
  // Modern travel zones have offsets in quarter hours. A DST fold yields two matches;
  // a skipped wall time yields none. Both require an explicit instant from the source.
  for(let t=nominal-14*3600000;t<=nominal+14*3600000;t+=15*60000)if(fmt.format(new Date(t))===`${date} ${time}`)matches.push(new Date(t).toISOString());
  const result=matches.length===1?matches[0]:null;cache.set(key,result);return result;
}
export function endpointCalendar(endpoint) {
  if (!endpoint) return {date:'',time:'',timeZone:''};
  if (endpoint.at && endpointInstant(endpoint) && validZone(endpoint.timeZone)) {
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:endpoint.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(endpoint.at)).map(p=>[p.type,p.value]));
    return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`,timeZone:endpoint.timeZone};
  }
  const at=typeof endpoint.at==='string'?endpoint.at:'';
  return {date:typeof endpoint.date==='string'?endpoint.date:at.slice(0,10),time:typeof endpoint.time==='string'?endpoint.time:at.slice(11,16),timeZone:typeof endpoint.timeZone==='string'?endpoint.timeZone:''};
}
export function resolveRentalDays(data, labels={pickUp:'Pick up the vehicle',dropOff:'Return the vehicle'}) {
  const days=(data.days||[]).map(day=>({...day,events:[...(day.events||[])]}));
  if(!data.rental)return days;
  const existing=new Map();
  for(const day of days){day.events.forEach((event,index)=>{if(event.rentalRef)existing.set(event.rentalRef,{event,date:day.date,index});});day.events=day.events.filter(event=>!event.rentalRef);}
  for(const key of ['pickUp','dropOff']) {
    const endpoint=data.rental[key], calendar=endpointCalendar(endpoint);
    const target=days.find(day=>day.date===calendar.date);if(!target)continue;
    const prior=existing.get(key);
    const event=prior?.event||{id:`rental-${key}`,title:labels[key],kind:'rental'};
    const derived={...event,rentalRef:key,timeLabel:[calendar.time,calendar.timeZone].filter(Boolean).join(' · '),placeIds:endpoint.placeId?[endpoint.placeId]:[],sourceRefs:endpoint.sourceRefs||data.rental.sourceRefs||[]};
    let index;
    if(prior?.date===calendar.date && (prior.event.timeLabel||'').startsWith(calendar.time))index=Math.min(prior.index,target.events.length);
    else {
      index=target.events.findIndex(e=>/^\d\d:\d\d/.test(e.timeLabel||'') && e.timeLabel.slice(0,5)>calendar.time);
      if(index<0){let last=-1;target.events.forEach((e,i)=>{if(/^\d\d:\d\d/.test(e.timeLabel||'')&&e.timeLabel.slice(0,5)<=calendar.time)last=i;});index=last+1;}
    }
    target.events.splice(index,0,derived);
  }
  return days;
}
