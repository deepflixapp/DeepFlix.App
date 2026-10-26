import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const preview=process.argv.includes('--preview'),production=process.argv.includes('--production');
if(preview===production)throw new Error('Selecione --preview ou --production.');
const envArgs=preview?['--env','preview']:[];
const vars=await readFile(production?'.dev.vars.production':'.dev.vars.preview','utf8');
const token=vars.match(/^TMDB_READ_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'');
if(!token)throw new Error('TMDB_READ_TOKEN ausente no arquivo local protegido.');
function wrangler(args){const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',maxBuffer:64*1024*1024});if(result.status!==0){process.stderr.write(result.stderr || result.stdout);throw new Error('Operação D1 falhou.');}return result.stdout;}
wrangler(['d1','execute','DB',...envArgs,'--remote','--file','worker/schema.sql']);
if(process.argv.includes('--apply-only')) {
  const names=process.argv.includes('--cinema')?['cinema']:['netflix','hbo-max','prime-video','disney-plus','apple-tv-plus','paramount-plus','globoplay','crunchyroll'];
  for(const name of names){wrangler(['d1','execute','DB',...envArgs,'--remote','--file',`.wrangler/platform-${name}.sql`]);console.log(`Índice validado aplicado: ${name}`);}
  process.exit(0);
}
const rows=JSON.parse(wrangler(['d1','execute','DB',...envArgs,'--remote','--command',"SELECT kind,id,json_extract(data,'$.tmdb_id') AS tmdb_id,year FROM catalog_entries WHERE kind<>'canais'",'--json'])).flatMap(row=>row.results || []);
const available=new Map();
for(const row of rows){const key=`${row.kind==='filme'?'movie':'tv'}:${row.tmdb_id}`;if(!available.has(key))available.set(key,[]);available.get(key).push(`${row.kind}:${row.id}`);}
const providerIds={'netflix':8,'hbo-max':1899,'prime-video':119,'disney-plus':337,'apple-tv-plus':350,'paramount-plus':531,'globoplay':307,'crunchyroll':283};
const selected=process.argv.find(arg=>arg.startsWith('--platform='))?.slice(11);
const providers=process.argv.includes('--cinema')?[['cinema',null]]:Object.entries(providerIds).filter(([slug])=>!selected || slug===selected);
if(!providers.length)throw new Error('Plataforma inválida.');
let nextRequest=0,requestCount=0;
async function tmdb(params){
  const due=Math.max(Date.now(),nextRequest);nextRequest=due+50;
  if(due>Date.now())await new Promise(resolve=>setTimeout(resolve,due-Date.now()));
  const response=await fetch(`https://api.themoviedb.org/3/${params}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
  requestCount++;
  if(!response.ok){await response.body?.cancel();throw new Error(`TMDB HTTP ${response.status}; mantido o índice anterior.`);}
  return response.json();
}
const literal=value=>`'${String(value).replace(/'/g,"''")}'`;
for(const [slug,providerId] of providers){
  const keys=new Set(),startCount=requestCount;
  console.log(`Consultando disponibilidade completa: ${slug}`);
  for(const type of slug==='cinema'?['movie']:['movie','tv']){
    const base=new URLSearchParams({language:'pt-BR',sort_by:'popularity.desc',include_adult:'false'});
    if(slug==='cinema')base.set('with_release_type','2|3');else{base.set('watch_region','BR');base.set('with_watch_providers',String(providerId));}
    const add=data=>{for(const item of data.results || [])for(const key of available.get(`${type}:${item.id}`) || [])keys.add(key);};
    const years=rows.filter(row=>(row.kind==='filme')===(type==='movie') && /^\d{4}$/.test(row.year)).map(row=>Number(row.year));
    const lower=`${Math.min(1870,...years)}-01-01`,upper=`${Math.max(new Date().getUTCFullYear()+2,...years)}-12-31`;
    async function discover(from=null,to=null){
      const query=new URLSearchParams(base);
      if(from){query.set(type==='movie'?'primary_release_date.gte':'first_air_date.gte',from);query.set(type==='movie'?'primary_release_date.lte':'first_air_date.lte',to);}
      const first=await tmdb(`discover/${type}?${query}&page=1`);
      if(Number(first.total_pages)>500){
        const start=new Date(`${from || lower}T00:00:00Z`).getTime(),end=new Date(`${to || upper}T00:00:00Z`).getTime();
        if(end-start<86400000)throw new Error('Janela de datas excede o limite de páginas TMDB.');
        const middle=Math.floor((start+end)/2/86400000)*86400000;
        await discover(new Date(start).toISOString().slice(0,10),new Date(middle).toISOString().slice(0,10));
        await discover(new Date(middle+86400000).toISOString().slice(0,10),new Date(end).toISOString().slice(0,10));return;
      }
      add(first);
      const pages=Number(first.total_pages) || 1;
      for(let page=2;page<=pages;page+=6)await Promise.all(Array.from({length:Math.min(6,pages-page+1)},(_,index)=>tmdb(`discover/${type}?${query}&page=${page+index}`).then(add)));
    }
    await discover();
  }
  const json=JSON.stringify([...keys]),staging=`${slug}:staging`,commands=[`INSERT INTO catalog_platforms(platform,data,updated_at,ready) VALUES (${literal(staging)},'',${Date.now()},0) ON CONFLICT(platform) DO UPDATE SET data='',updated_at=excluded.updated_at,ready=0;`];
  for(let offset=0;offset<json.length;offset+=30000)commands.push(`UPDATE catalog_platforms SET data=data || ${literal(json.slice(offset,offset+30000))} WHERE platform=${literal(staging)};`);
  commands.push(`INSERT INTO catalog_platforms(platform,data,updated_at,ready) SELECT ${literal(slug)},data,updated_at,1 FROM catalog_platforms WHERE platform=${literal(staging)} ON CONFLICT(platform) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at,ready=1;`,`DELETE FROM catalog_platforms WHERE platform=${literal(staging)};`);
  const path=`.wrangler/platform-${slug}.sql`;await writeFile(path,commands.join('\n')+'\n');
  wrangler(['d1','execute','DB',...envArgs,'--remote','--file',path]);
  console.log(`Concluído ${slug}: ${keys.size} títulos disponíveis, ${requestCount-startCount} páginas verificadas.`);
}
