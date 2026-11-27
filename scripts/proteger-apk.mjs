// Reduce legibilidad de los archivos distribuidos, sin cambiar nombres globales
// usados por los manejadores HTML ni por los módulos independientes de RAIET.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Script } from 'node:vm';
import { transform } from 'esbuild';

const root=resolve(process.argv[2] || 'www');
const opts={loader:'js', target:'esnext', minifyWhitespace:true,
  minifyIdentifiers:false,minifySyntax:false,legalComments:'inline',
  sourcemap:false,charset:'utf8'};
async function compactar(source, filename) {
  new Script(source,{filename});
  const out=await transform(source,{...opts,sourcefile:filename});
  new Script(out.code,{filename});
  return out.code;
}
for(const name of await readdir(root)){
  if(!name.endsWith('.js')||name==='raiet-native.js')continue;
  const path=join(root,name);
  const source=await readFile(path,'utf8');
  await writeFile(path,await compactar(source,name),'utf8');
}
const path=join(root,'index.html');
const html=await readFile(path,'utf8');
const re=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
let result='',cursor=0,count=0;
for(const m of html.matchAll(re)){
  result+=html.slice(cursor,m.index);
  const attrs=m[1];
  if(/\bsrc\s*=/i.test(attrs)||/\btype\s*=/i.test(attrs)){
    result+=m[0];
  }else{
    const code=await compactar(m[2],'index-inline-'+(++count)+'.js');
    if(/<\/script/i.test(code))throw new Error('Cierre HTML inesperado en script compactado');
    result+='<script'+attrs+'>'+code+'</script>';
  }
  cursor=m.index+m[0].length;
}
if(!count)throw new Error('No se identificaron scripts de la aplicación');
result+=html.slice(cursor);
await writeFile(path,result,'utf8');
console.log('JavaScript distribuido compactado sin renombrar identificadores. Scripts HTML:',count);
