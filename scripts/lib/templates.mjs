import fs from 'node:fs';
import path from 'node:path';
import {TEMPLATE} from './paths.mjs';

export const BASE_FILES = ['index.html','styles.css','themes.css','app.js','core.mjs','rental.mjs','motion.mjs','icons.mjs','sw.js','i18n/en.json','i18n/zh-CN.json'];
export function localFile(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error(`Unsafe local file: ${relative}`);
  const base=fs.realpathSync(root), candidate=path.resolve(base,relative);
  if (!candidate.startsWith(base+path.sep) || !fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) throw new Error(`Missing local file: ${relative}`);
  if (!fs.realpathSync(candidate).startsWith(base+path.sep)) throw new Error(`File escapes its root: ${relative}`);
  return candidate;
}
export function selectTemplate(trip, explicit) {
  const root=explicit?path.resolve(explicit):fs.existsSync(path.join(trip,'template'))?path.join(trip,'template'):TEMPLATE;
  const manifest=path.join(root,'manifest.json');
  const config=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):{};
  const files=config.files||BASE_FILES;
  if (!Array.isArray(files) || !files.length || new Set(files).size!==files.length) throw new Error('Template manifest.files must be a non-empty unique list.');
  for (const name of ['index.html','styles.css','sw.js']) if (!files.includes(name)) throw new Error(`Template missing required file: ${name}`);
  for (const name of files) {
    if (/^(?:travel-data\.json|assets\/|input\/|private\/)|(?:^|\/)(?:\.env(?:\.|$)|\.git(?:\/|$))/.test(name)) throw new Error(`Not a template source file: ${name}`);
    templateFile({root},name);
  }
  // A declared JS/CSS file must bring its literal local dependencies with it.
  for(const name of files.filter(file=>/\.(?:m?js|css)$/.test(file))) {
    const code=fs.readFileSync(templateFile({root},name),'utf8');
    const references=[...code.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"](\.[^'"]+)['"]/g),...code.matchAll(/\bimport\(\s*['"](\.[^'"]+)['"]\s*\)/g),...code.matchAll(/@import\s+['"]([^'"]+)['"]/g)];
    for(const match of references){const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1]));if(!files.includes(dependency))throw new Error(`Template ${name} imports undeclared file: ${dependency}`);}
  }
  if(config.validation)localFile(root,config.validation);
  return {root,files,validation:config.validation};
}

export function templateFile(template,name) {
  if(fs.existsSync(path.join(template.root,name)))return localFile(template.root,name);
  if(BASE_FILES.includes(name))return localFile(TEMPLATE,name);
  throw new Error(`Template file missing: ${name}`);
}
export function localePack(data,template) {
  if(typeof data.ui?.localePack==='string'&&data.ui.localePack)return data.ui.localePack;
  const locale=typeof data.trip?.locale==='string'?data.trip.locale:'en';
  const candidates=[locale,locale.split('-')[0],...(locale==='zh'?['zh-CN']:[])];
  return candidates.find(name=>template.files.includes(`i18n/${name}.json`)) || (locale.startsWith('zh')?'zh-CN':'en');
}
