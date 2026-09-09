import {build} from 'esbuild';
await build({entryPoints:['src/visual-entry.jsx'],bundle:true,outfile:'assets/story.js',format:'esm',minify:true,sourcemap:false,target:['safari16','chrome110'],jsx:'automatic',legalComments:'eof',define:{'process.env.NODE_ENV':'"production"'},logLevel:'info'});
