// Cloudflare Worker puro: serve estáticos ou entrega o HTML do index diretamente em qualquer rota
import indexHtml from './index.html';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Se for arquivo estático explícito com extensão
    if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse && assetResponse.status < 400) {
          return assetResponse;
        }
      } catch (_) {}
    }

    // Para todas as rotas (/filmes, /series, /canais, /assistir/...), entrega o HTML principal com status 200
    return new Response(indexHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  },
};
