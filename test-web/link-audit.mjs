// Audit only through the local Worker: no raw credential or stream-origin access.
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4174';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw new Error('Use a local preview.');
const requestJson = async path => {
  const response = await fetch(base+path,{signal:AbortSignal.timeout(90000)});
  return {status:response.status,data:await response.json()};
};
async function probe(path,depth=0) {
  const target = new URL(path,base);
  if (target.origin !== base) return {ok:false,reason:'external-frame-needs-browser'};
  const response = await fetch(target,{headers:{Range:'bytes=0-4095'},signal:AbortSignal.timeout(25000)});
  const type = response.headers.get('content-type') || '';
  if (response.ok && type.includes('mpegurl') && depth<3) {
    const text = await response.text();
    if (!text.trimStart().startsWith('#EXTM3U')) return {ok:false,status:response.status,reason:'invalid-manifest'};
    const next = text.split(/\r?\n/).find(line=>line && !line.startsWith('#'));
    return next ? probe(next,depth+1) : {ok:false,reason:'empty-manifest'};
  }
  const reader = response.body?.getReader();
  const chunk = await reader?.read(); await reader?.cancel();
  const bytes = chunk?.value || new Uint8Array();
  const text = new TextDecoder().decode(bytes.subarray(0,8192));
  const html = /text\/html/i.test(type) || /^\s*(?:<!doctype|<html|<head|<body|<script|<\?xml)/i.test(text);
  const box = new TextDecoder().decode(bytes.subarray(4,8));
  const signature = ['ftyp','styp','moof','moov'].includes(box) ||
    (bytes.length>188 && bytes[0]===0x47 && bytes[188]===0x47) ||
    (bytes[0]===0x1a && bytes[1]===0x45 && bytes[2]===0xdf && bytes[3]===0xa3);
  let reason = response.ok ? (html?'html-instead-of-media':!bytes.length?'empty-body':signature?'media-bytes':'unrecognized-media-signature') : `http-${response.status}`;
  if (!response.ok && /just a moment|cf-chl-|challenge-platform/i.test(text)) reason='origin-challenge';
  else if (!response.ok && /expired|expiration|signaturedoesnotmatch/i.test(text)) reason='expired-or-invalid-signature';
  return {ok:response.ok && signature && !html,status:response.status,type,reason,bytes:bytes.length};
}
const candidates=[{kind:'serie',id:'321291',title:'Territórios - Sob o Domínio do Crime'},{kind:'serie',id:'1973',title:'24 Horas'}];
const counts={};
for (const kind of ['filme','serie','anime','dorama','desenho','novela']) {
  const first=await requestJson(`/api/lista?category=${kind}&limit=6&page=1&sort=recent`);
  counts[kind]={total:first.data.total,status:first.status};
  candidates.push(...(first.data.results || []).slice(0,['filme','serie'].includes(kind)?6:2).map(item=>({kind,id:item.id,title:item.title})));
}
const rows=[];
const selected = new Set(process.argv.slice(2));
const sample = selected.size ? candidates.filter(item => selected.has(item.id)) : candidates;
for(let index=0;index<sample.length;index+=2) await Promise.all(sample.slice(index,index+2).map(async item=>{
  const row={...item};
  try {
    let season=1,episode=1;
    if(item.kind!=='filme') {
      const details=await requestJson(`/api/series/${encodeURIComponent(item.id)}?kind=${item.kind}&season=1`);
      row.detailsStatus=details.status; row.seasons=details.data.seasons?.length || 0; row.episodes=details.data.episodes?.length || 0;
      if(!row.episodes) {row.outcome='no-provider-episodes';row.diagnostics=details.data.diagnostics;rows.push(row);console.log(JSON.stringify(row));return;}
      season=details.data.season;episode=details.data.episodes[0].episode_number;
    }
    const play=await requestJson(`/api/play?kind=${item.kind}&id=${encodeURIComponent(item.id)}&season=${season}&episode=${episode}&refresh=1`);
    row.playStatus=play.status;row.options=play.data.options?.length || 0;row.checks=[];
    if(play.data.diagnostics?.length) row.diagnostics=play.data.diagnostics;
    for(const option of (play.data.options || []).slice(0,4)) {
      let result;
      try {
        result=option.kind==='iframe'?{ok:false,reason:'external-frame-needs-browser'}:await probe(option.url);
      } catch {
        result={ok:false,reason:'link-request-failed-or-timeout'};
      }
      row.checks.push({provider:option.provider || 'unspecified',...result});
      if(result.ok) break;
    }
    row.outcome=row.checks.some(check=>check.ok)?'media-received':row.checks.some(check=>check.reason==='external-frame-needs-browser')?'external-player-pending-browser':row.options?'all-sampled-links-failed':'no-resolved-options';
  } catch {row.outcome='request-failed-or-timeout';}
  rows.push(row);console.log(JSON.stringify(row));
}));
const summary={};for(const row of rows) summary[row.outcome]=(summary[row.outcome] || 0)+1;
await mkdir('docs',{recursive:true});
await writeFile('docs/link-audit.json',JSON.stringify({checkedAt:new Date().toISOString(),counts,sampleSize:rows.length,summary,results:rows},null,2)+'\n');
console.log(JSON.stringify({summary}));
