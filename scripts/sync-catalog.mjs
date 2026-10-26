import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createBackend } from '../worker/backend.mjs';
import { CATALOG_ALL_KINDS, saveCatalog } from '../worker/catalog.mjs';

const production=process.argv.includes('--production');
const preview=process.argv.includes('--preview');
if(production===preview)throw new Error('Selecione exatamente --preview ou --production.');
const selected=process.argv.find(arg=>arg.startsWith('--kind='))?.slice(7);
const kinds=selected?[selected]:CATALOG_ALL_KINDS;
if(kinds.some(kind=>!CATALOG_ALL_KINDS.includes(kind)))throw new Error('Categoria inválida.');
const envArgs=preview?['--env','preview']:[];
function wrangler(args) {
  const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',maxBuffer:64*1024*1024});
  if(result.status!==0){process.stderr.write(result.stderr || result.stdout);throw new Error('Falha ao executar operação D1.');}
  return result.stdout;
}
const literal=value=>value===null?'NULL':typeof value==='number'?String(value):`'${String(value).replace(/'/g,"''")}'`;
await mkdir('.wrangler',{recursive:true});
wrangler(['d1','execute','DB',...envArgs,'--remote','--file','worker/schema.sql']);
for(const kind of kinds) {
  console.log(`Lendo catálogo público: ${kind}`);
  const backend=createBackend({});
  await backend.ensureCatalog(kind);
  let items=kind==='canais'?backend.store.channels:backend.store.catalog[kind];
  if(kind==='canais') {
    // Preserve regional Pluto entries already delivered by the edge Worker.
    const origin=preview?'https://deepflix-preview.deepflix-app.workers.dev':'https://deepflix.deepflix-app.workers.dev';
    try {
      const response=await fetch(`${origin}/api/pluto/channels`,{headers:{Origin:origin},signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error('Origem regional não respondeu.');
      const data=await response.json();if(!Array.isArray(data) || !data.length)throw new Error('Lista regional vazia.');
      items=items.filter(item=>!item.id.startsWith('pluto-'));
      for(const item of data)if(/^[a-zA-Z0-9]+$/.test(item._id)) {
        items.push({id:`pluto-${item._id}`,kind:'canais',name:item.name,category:'Pluto TV',category_slug:'pluto-tv',subcategory:item.category || '',poster:item.colorLogoPNG?.path || '',servers:[{label:'Pluto TV',quality:'HD',route:`plutotv=https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/v2/stitch/hls/channel/${item._id}/master.m3u8`}]});
      }
    }catch{console.warn('A lista regional de Pluto não respondeu; mantidas as entradas da origem pública.');}
  }
  const commands=[];
  const db={
    prepare(sql){return {bind(...values){return {
      async run(){
        if(sql.startsWith('DELETE FROM catalog_entries')) {
          const response=JSON.parse(wrangler(['d1','execute','DB',...envArgs,'--remote','--command',`SELECT id FROM catalog_entries WHERE kind=${literal(kind)}`,'--json']));
          const wanted=new Set(JSON.parse(values[1]));
          const removed=response.flatMap(result=>result.results || []).map(row=>row.id).filter(id=>!wanted.has(id));
          if(!removed.length)return;
          sql='DELETE FROM catalog_entries WHERE kind=? AND id IN (SELECT value FROM json_each(?))';values=[kind,JSON.stringify(removed)];
        }
        function append(args){
          const rendered=(()=>{let index=0;return sql.replace(/\?/g,()=>literal(args[index++]));})();
          if(Buffer.byteLength(rendered)>90000 && sql.startsWith('INSERT INTO catalog_entries')) {
            const rows=JSON.parse(args[0]);if(rows.length<2)throw new Error('Registro maior que o limite SQL.');
            const middle=Math.floor(rows.length/2);append([JSON.stringify(rows.slice(0,middle))]);append([JSON.stringify(rows.slice(middle))]);return;
          }
          commands.push(rendered+';');
        }
        append(values);
      },
    };}};},
    async batch(statements){for(const statement of statements)await statement.run();},
  };
  const total=await saveCatalog(db,kind,items,20);
  if(kind==='canais')commands.push(`INSERT INTO catalog_config(key,data) VALUES ('iptv',${literal(JSON.stringify(backend.store.iptvConfig))}) ON CONFLICT(key) DO UPDATE SET data=excluded.data;`);
  const path=`.wrangler/catalog-${kind}.sql`;
  await writeFile(path,commands.join('\n')+'\n');
  console.log(`Gravando ${total} registros normalizados: ${kind}`);
  wrangler(['d1','execute','DB',...envArgs,'--remote','--file',path]);
  console.log(`Concluído: ${kind}, ${total} registros.`);
}
