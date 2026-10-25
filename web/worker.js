// Cloudflare Worker - DEEPFLIX
// Trata rotas SPA e proxies de CORS para resolver streams, canais e manifestos HLS

const RESOLVER_API_HOSTS = ['api.geekantenado.online', 'geekantenado.fly.dev'];
const RESOLVER_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyZXNvbHZlciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc5MDk4OTczfQ.WzQBuOqMai96Afleh9g-i7NXo6h-YsjPUbOgxlUqVsU';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Proxy para listagem e autenticação da Pluto TV
    if (url.pathname === '/api/pluto/channels') {
      try {
        const upstream = await fetch('https://api.pluto.tv/v2/channels.json?sid=44319783-8c70-11ef-a9be-cc7de27ba2f5&deviceId=44319783-8c70-4536-a9be-cc7de27ba2f5', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await upstream.text();
        return new Response(data, {
          status: upstream.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=1800'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (url.pathname === '/api/pluto/boot') {
      try {
        const bootParams = url.searchParams.toString();
        const upstream = await fetch(`https://boot.pluto.tv/v4/start?${bootParams}`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://pluto.tv/', 'Origin': 'https://pluto.tv' }
        });
        const data = await upstream.text();
        return new Response(data, {
          status: upstream.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300'
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Proxy de Streaming HLS (Pluto TV e m3u8 externos com restrição de CORS)
    if (url.pathname === '/api/pluto/stream') {
      const targetStreamUrl = url.searchParams.get('url');
      if (!targetStreamUrl) {
        return new Response('URL ausente', { status: 400 });
      }

      try {
        const upstream = await fetch(targetStreamUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Referer': 'https://pluto.tv/',
            'Origin': 'https://pluto.tv',
          }
        });

        // Se for manifesto m3u8, reescreve links relativos para passar pelo proxy
        const contentType = upstream.headers.get('content-type') || '';
        if (contentType.includes('mpegurl') || targetStreamUrl.includes('.m3u8')) {
          let manifestText = await upstream.text();
          const baseUrl = new URL(targetStreamUrl);
          
          manifestText = manifestText.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return line;
            try {
              const absoluteUri = new URL(trimmed, baseUrl).href;
              return `/api/pluto/stream?url=${encodeURIComponent(absoluteUri)}`;
            } catch {
              return line;
            }
          }).join('\n');

          return new Response(manifestText, {
            status: upstream.status,
            headers: {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache',
            }
          });
        }

        // Se for segmento de vídeo .ts ou outro recurso binário
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            'Content-Type': contentType || 'video/MP2T',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
          }
        });
      } catch (err) {
        return new Response('Stream fetch error: ' + err.message, { status: 502 });
      }
    }

    // 2. Endpoint proxy para descriptografar servidores de filmes e séries
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

    // 3. Despacho padrão de Assets Estáticos e SPA
    try {
      return await env.ASSETS.fetch(request);
    } catch (err) {
      return new Response('Assets fetch error: ' + err.message, { status: 500 });
    }
  },
};
