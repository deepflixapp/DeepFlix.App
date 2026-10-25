// Cloudflare Worker - DEEPFLIX
// Trata rotas SPA e proxy leve de CORS para resolver streams sem expor dados

const RESOLVER_API_HOSTS = ['api.geekantenado.online', 'geekantenado.fly.dev'];
const RESOLVER_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyZXNvbHZlciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc5MDk4OTczfQ.WzQBuOqMai96Afleh9g-i7NXo6h-YsjPUbOgxlUqVsU';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Endpoint proxy para descriptografar servidores de filmes e séries contornando restrições de CORS
    if (url.pathname === '/api/cf-resolve') {
      const resolverParam = url.searchParams.get('resolver') || '';
      if (!resolverParam) {
        return new Response(JSON.stringify({ error: 'Parâmetro resolver ausente' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      for (const host of RESOLVER_API_HOSTS) {
        try {
          const targetUrl = `https://${host}/?resolver=${encodeURIComponent(resolverParam)}`;
          const upstreamRes = await fetch(targetUrl, {
            headers: { Authorization: `Bearer ${RESOLVER_API_TOKEN}` }
          });
          if (upstreamRes.ok) {
            const data = await upstreamRes.text();
            return new Response(data, {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
              }
            });
          }
        } catch {}
      }

      return new Response(JSON.stringify({ error: 'Falha nos servidores resolvedores' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. Despacho padrão de Assets Estáticos e SPA
    try {
      return await env.ASSETS.fetch(request);
    } catch (err) {
      return new Response('Assets fetch error: ' + err.message, { status: 500 });
    }
  },
};
