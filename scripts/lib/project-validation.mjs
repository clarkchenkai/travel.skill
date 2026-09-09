import {pathToFileURL} from 'node:url';
import {validateTravelData,gapReport} from './validate.mjs';
import fs from 'node:fs';
import {localFile,templateFile,localePack} from './templates.mjs';
export async function projectValidation(data,template) {
  const result=validateTravelData(data);
  if(result.errors.length)return result;
  if(data.trip?.theme&&template.files.includes('themes.css')){const css=fs.readFileSync(templateFile(template,'themes.css'),'utf8');if([`[data-theme="${data.trip.theme}"]`,`[data-theme='${data.trip.theme}']`,`[data-theme=${data.trip.theme}]`].some(selector=>css.includes(selector)))result.warnings=result.warnings.filter(w=>w.path!=='trip.theme');}
  const pack=localePack(data,template);
  if(!data.ui?.localePack&&data.trip?.locale&&!([data.trip.locale,data.trip.locale.split('-')[0],...(data.trip.locale==='zh'?['zh-CN']:[])]).includes(pack))result.warnings.push({path:'ui.localePack',msg:`Requested interface ${data.trip.locale} is unavailable; using ${pack}. Add a language pack or explicitly confirm this fallback.`});
  if(!template.files.includes(`i18n/${pack}.json`))result.errors.push({path:'ui.localePack',msg:`Language pack must be declared in the template manifest: i18n/${pack}.json`});
  for(const spec of data.ui?.modules||[])if(!template.files.includes(spec.source))result.errors.push({path:'ui.modules',msg:`Module source must be declared in the template manifest: ${spec.source}`});
  if(result.errors.length||!template.validation)return result;
  const custom=await import(pathToFileURL(localFile(template.root,template.validation)).href);
  if(typeof custom.validate!=='function')throw new Error('Template validation module must export validate(data).');
  const extra=await custom.validate(data);
  if(!extra||!Array.isArray(extra.errors)||!Array.isArray(extra.warnings))throw new Error('Template validate() must return errors and warnings arrays.');
  return {errors:[...result.errors,...extra.errors],warnings:[...result.warnings,...extra.warnings]};
}
export async function projectGaps(data,template) {
  const base=gapReport(data);
  if(!template.validation||validateTravelData(data).errors.length)return base;
  const custom=await import(pathToFileURL(localFile(template.root,template.validation)).href);
  return typeof custom.gaps==='function'?[...base,...await custom.gaps(data)]:base;
}
