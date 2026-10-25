export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Se for requisição direta de arquivo com extensão (.js, .css, .svg, .png, etc.)
    if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404 && assetResponse.status !== 500) {
        return assetResponse;
      }
    }

    // Para qualquer outra rota da aplicação (ex: /filmes, /series, /canais, /assistir/...),
    // serve o index.html como página única SPA com status 200
    const indexRequest = new Request(new URL('/index.html', request.url), request);
    return env.ASSETS.fetch(indexRequest);
  },
};
