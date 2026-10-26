import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackend } from '../worker/backend.mjs';
import { createMediaProxy, safeFetch, validateTarget, MEDIA_USER_AGENT } from '../worker/proxy.mjs';

const env = {PROXY_SECRET:'test-only-secret-'.repeat(4),BRAZUCA_RESOLVER_TOKEN:'test'};
const movie = (id,title,year='1999',genre='Ficção científica') => `<item><title>${title}</title><tmdb_id>${id}</tmdb_id><date>${year}-01-01</date><genre>${genre}</genre><link>resolver3_mv=${id}</link></item>`;
const series = '<channel><name>Série de teste</name><tmdb_id>99</tmdb_id><externallink>#series_list=resolver2_tvshows=test</externallink></channel>';
const channel = n => `<item><title>[COLOR white]CANAL TESTE ${n}[/COLOR] [COLOR gold]HD[/COLOR]</title><link>chresolver1=${n}#1</link></item>`;
const channelXml = `<channels><channel_1><hostname_1>${Buffer.from('http://iptv.provider.net/live/%s/%s.m3u8').toString('base64')}</hostname_1><users_1>${Buffer.from('one/one|two/two').toString('base64')}</users_1>${Array.from({length:80},(_,i)=>channel(i)).join('')}</channel_1></channels>`;
function engine(extra = {}) {
  const requests=[];
  const fetcher = async (url,opts={}) => {
    requests.push(String(url));
    if (String(url).includes('/page.xml')) return new Response(`<items>${movie(1,'Matrix')}${movie(2,'Documentário novo','2026','Documentário')}${movie(3,'Show musical','2025','Música')}</items>`);
    if (String(url).includes('channels.xml')) return new Response(channelXml);
    if (String(url).includes('api.pluto.tv')) return Response.json(Array.from({length:60},(_,i)=>({_id:`p${i}`,name:`Pluto ${i}`})));
    if (String(url).includes('gist.githubusercontent')) return new Response(series);
    if (String(url).includes('geekantenado')) {
      const payload=Buffer.from(new URL(url).searchParams.get('resolver'),'base64').toString();
      if (payload.includes('tvshows=')) return Response.json({result:Buffer.from(JSON.stringify([{season_number:1,episodes:[{episode_number:1,link:'https://media.provider.net/1.m3u8'},{episode_number:3,link:'https://media.provider.net/3.mp4'}]},{season_number:2,episodes:[{episode_number:4,link:'https://media.provider.net/4.mp4'}]}])).toString('base64')});
      return Response.json({result:Buffer.from('https://media.provider.net/movie.mp4').toString('base64')});
    }
    if (String(url).includes('iptv.provider.net')) return new Response(String(url).includes('one/one')?'Forbidden':'#EXTM3U\nsegment.ts',{status:String(url).includes('one/one')?403:200});
    throw new Error('Unexpected URL: '+url);
  };
  return {backend:createBackend({...env,...extra},fetcher),requests};
}
const api = (backend,path) => backend.api(new Request('https://deepflix.test'+path));

test('a stalled invocation cannot own the catalog I/O awaited by a later invocation',async()=>{
  const shared={};
  let rejectStalled;
  const stalled=createBackend(env,async()=>new Promise((_resolve,reject)=>{rejectStalled=reject;}),shared);
  const first=stalled.ensureCatalog('filme').catch(()=>{});
  const independent=createBackend(env,async()=>new Response(movie(1,'Matrix')),shared);
  let timer;
  try {
    const response=await Promise.race([
      api(independent,'/api/lista?category=filme&page=1'),
      new Promise((_resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Later invocation waited on stalled request')),250);}),
    ]);
    assert.equal((await response.json()).results[0].id,'1');
    const cached=createBackend(env,async()=>{throw new Error('Completed catalog was fetched again');},shared);
    assert.equal((await (await api(cached,'/api/lista?category=filme&page=1')).json()).total,1);
  } finally {clearTimeout(timer);rejectStalled(new Error('Abandoned invocation'));await first;}
});

test('search with an explicit kind never loads unrelated catalogs or IPTV',async()=>{
  const {backend,requests}=engine();
  const response=await (await api(backend,'/api/lista?category=pesquisa&kind=filme&q=Matrix&page=1')).json();
  assert.equal(response.total,1);
  assert.equal(requests.length,1);
  assert.match(requests[0],/page\.xml/);
});

test('all channels are returned, including non-Pluto after the first 50; filter counters agree',async()=>{
  const {backend}=engine();
  const data=await (await api(backend,'/api/lista?category=canais&limit=1000&page=1')).json();
  assert.equal(data.results.length,140); assert.equal(data.total,140); assert.equal(data.hasMore,false);
  assert(data.results.some(ch=>ch.name==='CANAL TESTE 79'));
  assert(!JSON.stringify(data).includes('chresolver1='));
  assert(!JSON.stringify(data).includes('one/one'));
});
test('filter before pagination: year, genre, query, type, sort and limit',async()=>{
  const {backend}=engine();
  let data=await (await api(backend,'/api/lista?category=filme&q=Matrix&year=2026&page=1&limit=1')).json();
  assert.equal(data.total,0);
  data=await (await api(backend,'/api/lista?category=filme&genre=documentario&year=2026&page=1&limit=1')).json();
  assert.equal(data.total,1); assert.equal(data.results[0].id,'2');
  data=await (await api(backend,'/api/lista?category=shows&page=1')).json();
  assert.deepEqual(data.results.map(x=>x.id),['3']);
});
test('stable identifiers and old index aliases survive parsing and deduplication',async()=>{
  const {backend}=engine();
  const a=backend.parseCatalogXml('<item><title>Um</title><link>resolver3_mv=slug</link></item>','filme','item')[0];
  const b=backend.parseCatalogXml('<item><title>Outro</title><link>resolver3_mv=other</link></item><item><title>Um</title><link>resolver3_mv=slug</link></item>','filme','item')[1];
  assert.equal(a.id,b.id);
  await backend.ensureCatalog('filme');
  assert.equal(backend.store.byKindAndId.get('filme:filme_0').id,'1');
});
test('real provider seasons and episodes; no invented first-episode fallback',async()=>{
  const {backend}=engine();
  const details=await (await api(backend,'/api/series/99?kind=serie&season=2')).json();
  assert.deepEqual(details.seasons.map(s=>s.season_number),[1,2]);
  assert.deepEqual(details.episodes.map(e=>e.episode_number),[4]);
  const missing=await api(backend,'/api/play?kind=serie&id=99&season=2&episode=1');
  assert.equal(missing.status,502);
  const present=await (await api(backend,'/api/play?kind=serie&id=99&season=2&episode=4')).json();
  assert.equal(present.episode,4); assert.equal(present.options[0].kind,'video');
  assert.equal((await api(backend,'/api/play?kind=serie&id=not-found')).status,404);
});
test('IPTV tries alternate credentials and only emits HTTPS-origin opaque tokens',async()=>{
  const {backend,requests}=engine();
  const result=await (await api(backend,'/api/play?kind=canais&id=tv-canal-teste-1')).json();
  assert.equal(result.options.length,1); assert.equal(result.options[0].kind,'hls');
  assert(result.options[0].url.startsWith('/api/proxy?token='));
  assert(requests.some(x=>x.includes('one/one'))); assert(requests.some(x=>x.includes('two/two')));
});

test('43 regional IPTV variants authenticate the server once instead of spending 215 subrequests',async()=>{
  const requests=[];
  const xml=`<channels><channel_1><hostname_1>${Buffer.from('https://iptv.provider.net/live/%s/%s.m3u8').toString('base64')}</hostname_1><users_1>${Buffer.from('one/one|two/two|three/three|four/four|five/five').toString('base64')}</users_1>${Array.from({length:43},(_,i)=>`<item><title>[COLOR white]GLOBO SP[/COLOR] [COLOR gold]HD[/COLOR]</title><link>chresolver1=${i+1}#1</link></item>`).join('')}</channel_1></channels>`;
  const backend=createBackend(env,async target=>{
    requests.push(String(target));
    if(String(target).includes('channels.xml'))return new Response(xml);
    if(String(target).includes('api.pluto.tv'))return Response.json([]);
    if(String(target).includes('player_api.php'))return Response.json({user_info:{auth:1,status:'Active'}});
    throw new Error('Unexpected stream probe');
  });
  const result=await (await api(backend,'/api/play?kind=canais&id=tv-globo')).json();
  assert.equal(result.options.length,43);
  assert.equal(requests.filter(target=>target.includes('player_api.php')).length,1);
  assert.ok(result.options.every(option=>option.url.startsWith('/api/proxy?token=')));
});
test('map and sitemap XML contain normalized real catalog entries',async()=>{
  const {backend}=engine();
  const map=await (await api(backend,'/api/mapa?kind=filme&limit=500&page=1')).json();
  assert.equal(map.total,3);
  const xml=await api(backend,'/sitemap.xml');
  assert.match(xml.headers.get('content-type'),/xml/); assert.match(await xml.text(),/\/assistir\/filme\/1/);
});
test('opaque proxy detects tampering, expiry, invalid destinations and unsafe redirects',async()=>{
  const proxy=createMediaProxy(env);
  const link=proxy.url('https://media.provider.net/live/password/movie.mp4');
  const token=new URL(link,'https://deepflix.test').searchParams.get('token');
  assert.equal(proxy.decode(token).u,'https://media.provider.net/live/password/movie.mp4');
  assert.equal(proxy.decode(token.slice(0,-5)+'AAAAA'),null);
  assert(!Buffer.from(token,'base64url').toString().includes('password'));
  for(const target of ['http://127.0.0.1','http://0x7f000001','http://[::1]','http://metadata.google.internal','file:///tmp/test','https://user:password@media.provider.net']) assert.throws(()=>validateTarget(target));
  await assert.rejects(safeFetch('https://media.provider.net',{},async()=>new Response(null,{status:302,headers:{location:'http://127.0.0.1'}})));
});
test('media proxy cannot serve an upstream HTML or script document on the application origin',async()=>{
  const proxy=createMediaProxy(env,async()=>new Response('<script>malicious()</script>',{headers:{'Content-Type':'text/html'}}));
  const response=await proxy.handle(new Request('https://deepflix.test'+proxy.url('https://media.provider.net/movie.mp4')));
  assert.equal(response.status,502);assert.match(response.headers.get('content-type'),/json/);assert.ok(!(await response.text()).includes('<script>'));
});

test('HLS rewrites variants, relative segments, maps, AES keys, audio and subtitles',()=>{
  const proxy=createMediaProxy(env);
  const result=proxy.rewrite('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="../key"\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-MEDIA:TYPE=SUBTITLES,URI="sub/vtt.m3u8"\nvariant.m3u8\n/segment.ts','https://media.provider.net/base/master.m3u8',{});
  const tokens=[...result.matchAll(/token=([A-Za-z0-9_-]+)/g)].map(m=>proxy.decode(m[1]).u);
  assert.deepEqual(tokens,['https://media.provider.net/key','https://media.provider.net/base/init.mp4','https://media.provider.net/base/sub/vtt.m3u8','https://media.provider.net/base/variant.m3u8','https://media.provider.net/segment.ts']);
});
test('proxy preserves HEAD, Range, content-range and status without buffering video',async()=>{
  let received;
  const proxy=createMediaProxy(env,async(url,opts)=>{received=opts;return new Response('video',{status:206,headers:{'content-type':'video/mp4','content-range':'bytes 0-4/100','accept-ranges':'bytes'}});});
  const response=await proxy.handle(new Request('https://deepflix.test'+proxy.url('https://media.provider.net/video.mp4'),{headers:{Range:'bytes=0-4'}}));
  assert.equal(response.status,206); assert.equal(response.headers.get('content-range'),'bytes 0-4/100'); assert.equal(received.headers.Range,'bytes=0-4');
  assert.equal(received.headers['User-Agent'],MEDIA_USER_AGENT);
  assert.equal(received.headers.Accept,'*/*');
  assert.equal(response.headers.get('content-type'),'video/mp4');
  assert.equal(await response.text(),'video');
});

test('Worker clears its connection deadline when headers arrive instead of aborting a healthy video body',async()=>{
  let signal;
  const response=await safeFetch('https://media.provider.net/video.mp4',{headerTimeoutMs:5},async(_url,options)=>{signal=options.signal;return new Response('video');});
  await new Promise(resolve=>setTimeout(resolve,25));
  assert.equal(signal.aborted,false);
  assert.equal(await response.text(),'video');
});

test('legacy lowercase media headers override defaults without merging duplicate User-Agent values',async()=>{
  let headers;
  const proxy=createMediaProxy(env,async(_url,options)=>{headers=options.headers;return new Response('media',{headers:{'content-type':'video/mp4'}});});
  const response=await proxy.handle(new Request('https://deepflix.test'+proxy.url('https://media.provider.net/test.mp4',{'user-agent':'Provider Agent',referer:'https://provider.net/'})));
  await response.text();
  assert.equal(headers['User-Agent'],'Provider Agent');assert.equal(headers.Referer,'https://provider.net/');assert.equal(headers['user-agent'],undefined);
});

test('Overflix uses the canonical redirect origin for AJAX, referer and seasons',async()=>{
  const calls=[];
  const backend=createBackend(env,async(url,options)=>{
    const target=new URL(url);calls.push({url,referer:options.headers?.Referer});
    if(target.hostname==='www.overflix.press') return new Response(null,{status:302,headers:{Location:'https://mirror.provider.net/'}});
    let response;
    if(target.pathname==='/') response=new Response('Home');
    else if(target.searchParams.get('do')==='playerData') response=Response.json({servers_dub:'mixdrop=asset42',players:[{label:'Mixdrop',url:'https://mixdrop.top/e/'}]});
    else if(target.searchParams.get('do')==='episodesList') response=Response.json({episodes:[{url:'serie-episodio-12',number:2,title:'Capítulo 2'}]});
    else response=new Response('<section class="vbEpisodes" data-video-id="77" data-audio="Dublado"><span data-season="1"></span></section>');
    Object.defineProperty(response,'url',{value:url});return response;
  });
  const options=await backend.resolveSingleRoutePlay('movie2=filme-42');
  assert.equal(options[0].kind,'iframe');assert.equal(options[0].url,'https://mixdrop.top/e/asset42');
  const episodes=await backend.fetchBrazucaSeriesProviderData({id:'77',kind:'serie',routes:['serie3=serie-77']});
  assert(episodes.get(1).has(2));
  assert(calls.filter(call=>call.url.includes('index.php')).every(call=>call.url.startsWith('https://mirror.provider.net/') && call.referer.startsWith('https://mirror.provider.net/')));
});

test('refresh bypasses both playback and resolver response caches to renew a signed link',async()=>{
  let generation=1;
  const backend=createBackend(env,async url=>String(url).includes('gist.githubusercontent') ? new Response(`<items>${movie(1,'Filme')}</items>`) : Response.json({result:Buffer.from(`https://media.provider.net/${generation}.mp4`).toString('base64')}));
  const proxy=createMediaProxy(env);
  const target = data => proxy.decode(new URL(data.options[0].url,'https://deepflix.test').searchParams.get('token')).u;
  assert.match(target(await (await api(backend,'/api/play?kind=filme&id=1')).json()),/\/1\.mp4$/);
  generation=2;
  assert.match(target(await (await api(backend,'/api/play?kind=filme&id=1&refresh=1')).json()),/\/2\.mp4$/);
});

test('old search and playlist routes are served by the Worker without leaking IPTV credentials',async()=>{
  const {backend}=engine();
  const search=await (await api(backend,'/api/search?q=Matrix&kind=filme')).json();assert.equal(search.results[0].title,'Matrix');
  const playlist=await api(backend,'/playlist.m3u8');const text=await playlist.text();
  assert.match(text,/#EXTM3U/);assert.match(text,/\/api\/channel-stream\//);assert(!text.includes('one/one'));assert(!text.includes('iptv.provider.net'));
  const stream=await api(backend,'/api/channel-stream/tv-canal-teste-1.m3u8');assert.equal(stream.status,307);assert.match(stream.headers.get('location'),/\/api\/proxy\?token=/);
});

test('all five resolver families normalize player kind and keep episode parameters',async()=>{
  const requests=[];
  const backend=createBackend(env,async url=>{
    const params=Buffer.from(new URL(url).searchParams.get('resolver'),'base64').toString();
    requests.push(params);
    return Response.json({result:Buffer.from('https://media.provider.net/stream.m3u8').toString('base64')});
  });
  for(const n of [1,2,3,4,5]) {
    const options=await backend.resolveSingleRoutePlay(`resolver${n}_episodes=series#2#4#Dublado`);
    assert.equal(options[0].kind,'hls');
    assert(options[0].url.startsWith('/api/proxy?token='));
  }
  assert(requests.every(request=>request.includes('series#2#4#Dublado')));
});

test('platforms fetch beyond page one, serialize shared TV queries, then filter and paginate',async()=>{
  let pages=[];
  const backend=createBackend({...env,TMDB_READ_TOKEN:'test'},async url=>{
    const target=new URL(url);
    if(target.hostname==='api.themoviedb.org') {
      const page=Number(target.searchParams.get('page')); pages.push(page);
      return Response.json({total_pages:3,results:page===3?[{id:1},{id:2}]:[]});
    }
    return new Response(`<items>${movie(1,'Matrix')}${movie(2,'Outro','2026')}</items>`);
  });
  const response=await api(backend,'/api/lista?category=filme&platform=netflix&year=2026&limit=1&page=1');
  const data=await response.json();
  assert.equal(data.results[0].id,'2'); assert.equal(data.total,1);
  assert.deepEqual(pages.sort(),[1,2,3]);
});

test('regional aliases survive repeated catalog rebuilds; quality variants stay available',async()=>{
  const {backend}=engine();
  const parsed=backend.parseChannelsXml(`<channels><channel_1><item><title>[COLOR white]GLOBO SP[/COLOR] [COLOR gold]HD[/COLOR]</title><link>chresolver1=1#1</link></item><item><title>[COLOR white]GLOBO RJ[/COLOR] [COLOR gold]SD[/COLOR]</title><link>chresolver1=2#1</link></item></channel_1></channels>`);
  assert.equal(parsed.channels.length,1); assert.equal(parsed.channels[0].servers.length,2);
  assert(parsed.channels[0].aliases.includes('tv-globo-sp'));
  await backend.ensureCatalog('canais'); await backend.ensureCatalog('filme');
  assert(backend.store.byKindAndId.has('canais:tv-canal-teste-79'));
  assert(backend.store.byKindAndId.has('canais:pluto-p1'));
});

test('actor and platform filters are intersected before pagination',async()=>{
  const backend=createBackend({...env,TMDB_READ_TOKEN:'test'},async url=>{
    const target=new URL(url);
    if(target.pathname.includes('/search/person')) return Response.json({results:[{id:5,name:'Ator de teste'}]});
    if(target.pathname.includes('/combined_credits')) return Response.json({cast:[{id:1,media_type:'movie'},{id:2,media_type:'movie'}]});
    if(target.pathname.includes('/discover/movie')) return Response.json({total_pages:1,results:[{id:2}]});
    if(target.hostname==='gist.githubusercontent.com') return new Response(`<items>${movie(1,'Primeiro')}${movie(2,'Segundo')}</items>`);
    throw new Error('Unexpected request');
  });
  const data=await (await api(backend,'/api/lista?category=pesquisa&kind=filme&actor=Ator&platform=netflix&page=1&limit=1')).json();
  assert.equal(data.total,1); assert.equal(data.results[0].title,'Segundo');
});
