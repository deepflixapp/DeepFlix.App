import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {catalogDatabase,saveCatalog,CATALOG_KINDS} from '../worker/catalog.mjs';
import {createBackend} from '../worker/backend.mjs';

let mf,db;
const item=(kind,id,title,year='1999',genres=['Ficção científica'])=>({kind,id:String(id),tmdb_id:String(id),title,year,date:`${year}-01-01`,genres,aliases:[`${kind}_${id}`],routes:[`resolver3_mv=${id}`]});
before(async()=>{
  mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-25',d1Databases:['DB']}));
  db=await mf.getD1Database('DB');
  await db.exec((await readFile('worker/schema.sql','utf8')).replace(/\n/g,' '));
  await saveCatalog(db,'filme',[item('filme',1,'Matrix'),item('filme',2,'Documentário novo','2026',['Documentário']),item('filme',3,'Show de música','2025',['Música'])]);
  for(const kind of CATALOG_KINDS.filter(kind=>kind!=='filme'))await saveCatalog(db,kind,[item(kind,99,`Teste ${kind}`)]);
  await saveCatalog(db,'canais',[{kind:'canais',id:'tv-teste',name:'Canal Teste',servers:[]}]);
});
after(async()=>{await mf?.dispose();});
const request=(backend,path)=>backend.api(new Request('https://deepflix.test'+path));

test('D1 serves complete cross-category search and filters before pagination without fetching XML',async()=>{
  const backend=createBackend({DB:db},async()=>{throw new Error('Interactive request fetched source XML');});
  let result=await (await request(backend,'/api/lista?category=pesquisa&q=Matrix&page=1&limit=1')).json();
  assert.equal(result.total,1);assert.equal(result.results[0].id,'1');
  assert.ok(!JSON.stringify(result).includes('resolver3_mv'));
  result=await (await request(backend,'/api/lista?category=pesquisa&q=Matrix&year=2026&page=1')).json();assert.equal(result.total,0);
  result=await (await request(backend,'/api/lista?category=filme&page=2&limit=1&sort=recent')).json();assert.equal(result.results[0].id,'3');assert.equal(result.total,3);
  result=await (await request(backend,'/api/lista?category=documentarios&page=1')).json();assert.deepEqual(result.results.map(row=>row.id),['2']);
  result=await (await request(backend,'/api/lista?category=shows&page=1')).json();assert.deepEqual(result.results.map(row=>row.id),['3']);
});

test('D1 details and aliases preserve the requested content; missing IDs do not fall back',async()=>{
  const backend=createBackend({DB:db},async()=>{throw new Error('Unexpected network request');});
  const details=await (await request(backend,'/api/movie/filme_1')).json();assert.equal(details.id,'1');assert.equal(details.details.title,'Matrix');
  assert.equal((await request(backend,'/api/movie/not-found')).status,404);
  const catalog=catalogDatabase(db);assert.equal((await catalog.find('filme','filme_500','Matrix')).id,'1');
});

test('D1 map and sitemap index cover normalized entries including channels without loading XML',async()=>{
  const backend=createBackend({DB:db},async()=>{throw new Error('Sitemap fetched XML');});
  const map=await (await request(backend,'/api/mapa?kind=all&limit=500')).json();assert.equal(map.total,9);assert.equal(map.counts.canais,1);assert.ok(map.results.some(row=>row.href==='/assistir/canais/tv-teste'));
  const sitemap=await (await request(backend,'/sitemap.xml')).text();assert.match(sitemap,/<sitemapindex/);assert.match(sitemap,/\/sitemaps\/filme\/1.xml/);
  const page=await (await request(backend,'/sitemaps/filme/1.xml')).text();assert.match(page,/\/assistir\/filme\/1/);
});

test('platform membership from D1 intersects type, year and title before pagination without TMDB calls',async()=>{
  await db.prepare('INSERT INTO catalog_platforms(platform,data,updated_at,ready) VALUES (?,?,?,1)').bind('netflix',JSON.stringify(['filme:1','filme:2','serie:99']),Date.now()).run();
  const backend=createBackend({DB:db},async()=>{throw new Error('Platform pagination fetched TMDB in an interactive request');});
  const first=await (await request(backend,'/api/lista?category=pesquisa&platform=netflix&kind=filme&page=1&limit=1')).json();assert.equal(first.total,2);assert.equal(first.results[0].id,'2');assert.equal(first.hasMore,true);
  const filtered=await (await request(backend,'/api/lista?category=pesquisa&platform=netflix&q=Matrix&year=2026&page=1')).json();assert.equal(filtered.total,0);
  assert.equal((await request(backend,'/api/lista?category=filme&platform=hbo-max&page=1')).status,503);
});

test('D1 treats percent and underscore as literal search text and imports are idempotent',async()=>{
  const catalog=catalogDatabase(db);
  assert.equal((await catalog.list({query:'%',category:'filme'})).total,0);
  const original=await catalog.find('filme','1');await saveCatalog(db,'filme',[original]);
  assert.equal((await catalog.list({category:'filme'})).total,1);assert.equal((await catalog.find('filme','1')).routes[0],'resolver3_mv=1');
});
