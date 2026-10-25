export default {
  async fetch(request, env) {
    try {
      return await env.ASSETS.fetch(request);
    } catch (err) {
      return new Response('Assets fetch error: ' + err.message, { status: 500 });
    }
  },
};
