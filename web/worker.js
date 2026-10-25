export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Tenta primeiro buscar o arquivo estático exatamente como pedido (ex: /app.js, /styles.css, /logo.svg)
    let response = await env.ASSETS.fetch(request);

    // Se a rota não for um arquivo físico direto (como /filmes, /series, /assistir/filme/123),
    // serve o index.html como página única SPA com status 200
    if (response.status === 404 || response.status === 403) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      response = await env.ASSETS.fetch(indexRequest);
    }

    return response;
  },
};
