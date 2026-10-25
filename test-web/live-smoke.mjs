// Opt-in smoke checks against LOCAL preview; never creates accounts in production.
import { writeFile, mkdir } from 'node:fs/promises';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4174';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Live smoke must target a local preview.');
const report = {checkedAt:new Date().toISOString(),base,results:[]};
async function json(path) {
  const response=await fetch(base+path,{signal:AbortSignal.timeout(90000)});
  return {status:response.status,data:await response.json()};
}
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
async function inspectMedia(path,depth=0) {
  const response=await fetch(base+path,{headers:{Range:'bytes=0-4095'},signal:AbortSignal.timeout(25000)});
  if(!response.ok) {await response.body?.cancel();return {status:response.status};}
  const type=response.headers.get('content-type') || '';
  if(type.includes('mpegurl') && depth<3) {
    const text=await response.text();
    const next=text.split(/\r?\n/).find(line=>line && !line.startsWith('#'));
    return {status:response.status,type,child:next ? await inspectMedia(next,depth+1):null};
  }
  const reader=response.body?.getReader();
  const chunk=await reader?.read(); await reader?.cancel();
  return {status:response.status,type,bytes:chunk?.value?.length || 0};
}
for(const [kind,query] of [['filme','Matrix'],['serie','24 Horas'],['anime','009-1'],['dorama','1 Litro de Lágrimas'],['desenho','Bob Esponja'],['novela','A Bíblia'],['canais','Globo'],['canais','Pluto']]) {
  const row={kind,query};
  try {
    const catalog=await json(`/api/lista?category=${kind}&q=${encodeURIComponent(query)}&page=1&limit=1000`);
    const items=catalog.data.results || [];
    const item=items.find(x=>normalize(x.title || x.name)===normalize(query)) || items[0];
    row.catalogStatus=catalog.status; row.matches=items.length;
    if(!item) throw new Error('No matching catalog entry');
    row.title=item.title || item.name;
    let season=1,episode=1;
    if(!['filme','canais'].includes(kind)) {
      const details=await json(`/api/series/${encodeURIComponent(item.id)}?kind=${kind}&season=1`);
      row.detailsStatus=details.status; row.seasons=details.data.seasons?.length; row.episodes=details.data.episodes?.length;
      if(!details.data.episodes?.length) throw new Error('Provider returned no episodes');
      season=details.data.season; episode=details.data.episodes[0].episode_number;
    }
    const play=await json(`/api/play?kind=${kind}&id=${encodeURIComponent(item.id)}&season=${season}&episode=${episode}`);
    row.playStatus=play.status; row.options=play.data.options?.length || 0;
    if(row.options) {
      row.media=[];
      for(const option of play.data.options.slice(0,4)) {
        const result=option.kind === 'iframe' ? {kind:'iframe',status:'manual-check'} : await inspectMedia(option.url);
        row.media.push(result);
        if([200,206].includes(result.status)) break;
      }
    }
    else row.error=play.data.error;
  } catch(error) {row.error=error.message;}
  report.results.push(row);
  console.log(JSON.stringify(row));
}
await mkdir('docs',{recursive:true});
await writeFile('docs/live-smoke.json',JSON.stringify(report,null,2)+'\n');
