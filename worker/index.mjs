import { createBackend } from './backend.mjs';
import { handleAuth } from './auth.mjs';

const engines = new WeakMap();
function engine(env) {
  if (!engines.has(env)) engines.set(env,createBackend(env));
  return engines.get(env);
}
async function migrate(env,entries) {
  const backend = engine(env);
  for (const kind of new Set(entries.filter(item => /^(filme|serie|anime|dorama|desenho|novela)_\d+$/.test(item?.itemId || '') || item?.kind === 'canais').map(item => item.kind))) await backend.ensureCatalog(kind);
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  return entries.map(entry => {
    const indexed = backend.store.byKindAndId.get(`${entry.kind}:${entry.itemId}`);
    const legacy = /^(filme|serie|anime|dorama|desenho|novela)_\d+$/.test(entry.itemId);
    let item = indexed;
    if (legacy && (!item || normalize(item.title) !== normalize(entry.title))) item = (backend.store.catalog[entry.kind] || []).find(candidate => normalize(candidate.title) === normalize(entry.title));
    if (legacy && !item) return null;
    return item ? {...entry,itemId:item.id,key:`${entry.kind}:${item.id}`} : entry;
  });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['/api/health','/health'].includes(url.pathname)) return Response.json({ok:true,version:'20261025-v6',database:Boolean(env.DB),media:Boolean(env.PROXY_SECRET),resolver:Boolean(env.BRAZUCA_RESOLVER_TOKEN),metadata:Boolean(env.TMDB_READ_TOKEN || env.TMDB_API_KEY)});
    if (url.pathname.startsWith('/api/auth/') || ['/api/history','/api/favorites'].includes(url.pathname)) return handleAuth(request,env,entries => migrate(env,entries));
    if (url.pathname.startsWith('/api/') || url.pathname === '/sitemap.xml' || /^\/(?:playlist|canais)\.m3u8?$/.test(url.pathname)) {
      if (!['GET','HEAD'].includes(request.method)) return Response.json({error:'Método não permitido.'},{status:405});
      try {
        const response = await engine(env).api(request);
        return request.method === 'HEAD' ? new Response(null,{status:response.status,headers:response.headers}) : response;
      } catch {
        return Response.json({error:'Uma origem do catálogo não respondeu ou a configuração está incompleta. Tente novamente.'},{status:502,headers:{'Cache-Control':'no-store'}});
      }
    }
    return env.ASSETS.fetch(request);
  }
};
