export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Se for arquivo estático com extensão (.js, .css, .svg, etc.)
    if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    // Para todas as páginas da SPA (/filmes, /series, /canais, /),
    // busca a raiz '/' do asset storage
    const rootUrl = new URL('/', url.origin);
    const rootRequest = new Request(rootUrl.toString(), {
      method: 'GET',
      headers: request.headers,
    });

    return env.ASSETS.fetch(rootRequest);
  },
};
