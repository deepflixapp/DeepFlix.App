export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Se a requisição for para a raiz exata ou um arquivo estático (com ponto de extensão)
    if (url.pathname === '/' || /\.[a-zA-Z0-9]+$/.test(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    // Para qualquer rota virtual de SPA (ex: /filmes, /series, /canais),
    // reescreve a URL para /index.html antes de passar para o env.ASSETS
    const indexUrl = new URL('/index.html', url.origin);
    const indexRequest = new Request(indexUrl.toString(), {
      method: request.method,
      headers: request.headers,
    });

    return env.ASSETS.fetch(indexRequest);
  },
};
