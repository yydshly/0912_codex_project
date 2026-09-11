import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist');
await mkdir(dist,{recursive:true});
const bundle=await build({entryPoints:{'case-app':path.join(root,'src/case.tsx'),'generation-app':path.join(root,'src/generation.tsx')},outdir:dist,chunkNames:'chunks/[name]-[hash]',splitting:true,bundle:true,minify:true,format:'esm',platform:'browser',target:['es2022'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked',metafile:true});
for(const [output,info] of Object.entries(bundle.metafile.outputs)){
  if(info.imports.some(x=>x.external))throw new Error('Unbundled runtime dependency in '+output);
}
execFileSync(process.execPath,[path.join(root,'node_modules/@tailwindcss/cli/dist/index.mjs'),'-i',path.join(root,'src/sdk.css'),'-o',path.join(dist,'case-sdk.css'),'--minify'],{stdio:'inherit',cwd:root});
let attribution='OpenMAIC 互动案例依赖许可\n\n';
const lock=JSON.parse(await readFile(path.join(root,'package-lock.json'),'utf8'));
for(const [directory,info] of Object.entries(lock.packages)){
  if(!directory || info.dev)continue;
  const packageDir=path.join(root,directory);
  const files=await readdir(packageDir);
  for(const file of files.filter(x=>/^(licen[cs]e|notice)(\.|$)/i.test(x))){
    attribution+=directory.replace('node_modules/','')+' '+info.version+' / '+file+'\n'+await readFile(path.join(packageDir,file),'utf8')+'\n\n';
  }
}
await writeFile(path.join(dist,'case-dependencies-LICENSE.txt'),attribution);
console.log('Built the real OpenMAIC renderer case (renderer 0.1.6 / DSL 0.11.1).');
