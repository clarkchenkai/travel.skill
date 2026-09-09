export function validate(data) {
  const errors=[],warnings=[],b=data.business||{},ids=new Set();
  if(b.budget!=null&&(!Number.isFinite(b.budget.amount)||b.budget.amount<0||!(/^[A-Z]{3}$/).test(b.budget.currency||'')))errors.push({path:'business.budget',msg:'nonnegative amount and ISO currency, or null required'});
  if(b.expenses!==undefined&&!Array.isArray(b.expenses))errors.push({path:'business.expenses',msg:'array required'});
  for(const [i,e] of (Array.isArray(b.expenses)?b.expenses:[]).entries()){
    const path=`business.expenses[${i}]`;
    if(!e.id||ids.has(e.id))errors.push({path:path+'.id',msg:'unique id required'});ids.add(e.id);
    if(!e.title)errors.push({path:path+'.title',msg:'required'});
    if(e.amount!=null&&(!Number.isFinite(e.amount.amount)||e.amount.amount<0||!(/^[A-Z]{3}$/).test(e.amount.currency||'')))errors.push({path:path+'.amount',msg:'nonnegative amount and ISO currency, or null required'});
    if(e.allocation&&!['company','personal','unknown'].includes(e.allocation))errors.push({path:path+'.allocation',msg:'company, personal or unknown'});
  }
  function privacy(value,path){if(value&&typeof value==='object')for(const [key,v]of Object.entries(value)){if(/^(?:privateContact|privateAddress|receiptOriginal|clientEmail)$/i.test(key)&&v)errors.push({path:path+'.'+key,msg:'keep private business materials outside the public data'});privacy(v,path+'.'+key);}}
  privacy(b,'business');
  for(const [i,day]of(data.days||[]).entries())for(const [j,e]of(day.events||[]).entries())if(e.kind==='meeting')privacy(e,`days[${i}].events[${j}]`);
  return {errors,warnings};
}
export function gaps(data){const gaps=[];if(!data.business?.policy||data.business.policyStatus==='unknown')gaps.push({area:'business',item:'policy',why:'Company travel and expense policy is missing.'});for(const e of data.business?.expenses||[])if(!e.amount||!e.allocation||e.allocation==='unknown')gaps.push({area:'business',item:e.title,why:'Amount or company/personal allocation not confirmed.'});return gaps;}
