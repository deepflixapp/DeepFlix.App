import { createBackend } from './backend.mjs';
import { handleAuth } from './auth.mjs';

const completedData = new WeakMap();
function engine(env) {
  if (!completedData.has(env)) completedData.set(env,{});
  return createBackend(env,fetch,completedData.get(env));
}
async function migrate(env,entries) {
  return engine(env).migrateCatalogEntries(entries);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['/api/health','/health'].includes(url.pathname)) return Response.json({ok:true,version:'20261025-v7',database:Boolean(env.DB),media:Boolean(env.PROXY_SECRET),resolver:Boolean(env.BRAZUCA_RESOLVER_TOKEN),metadata:Boolean(env.TMDB_READ_TOKEN || env.TMDB_API_KEY)});
    if (url.pathname.startsWith('/api/auth/') || ['/api/history','/api/favorites'].includes(url.pathname)) return handleAuth(request,env,entries => migrate(env,entries));
    if (url.pathname.startsWith('/api/') || url.pathname === '/sitemap.xml' || url.pathname.startsWith('/sitemaps/') || /^\/(?:playlist|canais)\.m3u8?$/.test(url.pathname)) {
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
