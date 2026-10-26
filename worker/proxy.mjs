import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';

export const MEDIA_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

export function validateTarget(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  // IP literals, local names and userinfo are never valid media destinations.
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      !host.includes('.') || /[\[\]:]/.test(host) || /^\d+(?:\.\d+)*$/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(host) ||
      /(?:^|\.)(?:metadata\.google\.internal|nip\.io|sslip\.io)$/.test(host)) {
    throw new Error('Destino de mídia inválido.');
  }
  if (url.port && !['80', '443', '8080', '8000', '8880', '25461'].includes(url.port)) throw new Error('Porta de mídia inválida.');
  return url;
}

export async function safeFetch(value, options = {}, fetcher = fetch) {
  let url = validateTarget(value);
  for (let hop = 0; hop < 6; hop++) {
    // Node's old socket timeout did not impose a 15-second lifetime on video.
    // Clear the connection deadline once headers arrive; caller cancellation
    // and explicit metadata deadlines still propagate while consuming a body.
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), options.headerTimeoutMs ?? 15000);
    const signal = options.signal ? AbortSignal.any([options.signal, deadline.signal]) : deadline.signal;
    let response;
    try { response = await fetcher(url.href, { ...options, redirect: 'manual', signal }); }
    finally { clearTimeout(timer); }
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const next = response.headers.get('location');
    await response.body?.cancel();
    if (!next) throw new Error('Redirecionamento sem destino.');
    const previous = url;
    url = validateTarget(new URL(next, url));
    if (previous.origin !== url.origin) {
      const headers = new Headers(options.headers);
      headers.delete('Authorization');
      headers.delete('Cookie');
      options = { ...options, headers };
    }
  }
  throw new Error('Muitos redirecionamentos na origem.');
}

export function createMediaProxy(env, fetcher = fetch) {
  const headerNames = {referer:'Referer',origin:'Origin','user-agent':'User-Agent'};
  function key() {
    if (!env.PROXY_SECRET || env.PROXY_SECRET.length < 32) throw new Error('PROXY_SECRET não configurado.');
    return crypto.createHash('sha256').update(env.PROXY_SECRET).digest();
  }
  function url(rawUrl, headers = {}) {
    const [source, query] = String(rawUrl).split('|', 2);
    const target = validateTarget(source);
    const safeHeaders = {};
    for (const [name, value] of Object.entries({ ...headers, ...Object.fromEntries(new URLSearchParams(query)) })) {
      if (headerNames[name.toLowerCase()]) safeHeaders[headerNames[name.toLowerCase()]] = String(value);
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
    const data = Buffer.concat([cipher.update(JSON.stringify({ u: target.href, h: safeHeaders, exp: Date.now() + 3600000 }), 'utf8'), cipher.final()]);
    return `/api/proxy?token=${Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url')}`;
  }
  function decode(token) {
    try {
      const data = Buffer.from(token, 'base64url');
      const cipher = crypto.createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12));
      cipher.setAuthTag(data.subarray(12, 28));
      const value = JSON.parse(Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString('utf8'));
      return value.exp > Date.now() ? value : null;
    } catch { return null; }
  }
  function rewrite(text, base, headers) {
    return text.split(/\r?\n/).map(line => {
      if (!line.trim()) return line;
      if (line.trimStart().startsWith('#')) return line.replace(/URI="([^"]+)"/gi, (_, uri) => `URI="${url(new URL(uri, base).href, headers)}"`);
      return url(new URL(line.trim(), base).href, headers);
    }).join('\n');
  }
  async function handle(request) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 });
    const data = decode(new URL(request.url).searchParams.get('token') || '');
    if (!data) return Response.json({ error: 'Link de mídia inválido ou expirado. Reabra o player.' }, { status: 403 });
    const headers = { 'User-Agent':MEDIA_USER_AGENT, Accept:'*/*', 'Accept-Encoding':'identity' };
    for (const [name,value] of Object.entries(data.h || {})) if (headerNames[name.toLowerCase()]) headers[headerNames[name.toLowerCase()]] = value;
    if (request.headers.has('range')) headers.Range = request.headers.get('range');
    try {
      const upstream = await safeFetch(data.u, { method: request.method, headers, signal:request.signal }, fetcher);
      const output = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      for (const name of ['content-type', 'content-range', 'accept-ranges', 'content-length']) if (upstream.headers.has(name)) output.set(name, upstream.headers.get(name));
      const type = (upstream.headers.get('content-type') || '').toLowerCase();
      if(/html|javascript|svg\+xml/.test(type)) {
        await upstream.body?.cancel();
        return Response.json({error:'A origem retornou uma página em vez de mídia. Tente outro servidor.'},{status:upstream.status>=400?upstream.status:502,headers:{'Cache-Control':'no-store','X-Deepflix-Origin-Status':String(upstream.status)}});
      }
      const finalUrl = upstream.url || data.u;
      const pathname = new URL(finalUrl).pathname.toLowerCase();
      if (upstream.headers.has('content-encoding') && upstream.headers.get('content-encoding') !== 'identity') output.delete('content-length');
      output.set('X-Deepflix-Origin-Status', String(upstream.status));
      if (request.method !== 'HEAD' && upstream.ok && (type.includes('mpegurl') || /\.(?:m3u8|m3u)$/i.test(pathname) || (pathname.endsWith('.txt') && type.startsWith('text/')))) {
        const text = await upstream.text();
        if (!text.trimStart().startsWith('#EXTM3U')) return Response.json({ error: 'A origem retornou uma playlist inválida.' }, { status: 502 });
        output.set('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        output.delete('content-length');
        return new Response(rewrite(text, finalUrl, data.h), { status: upstream.status, headers: output });
      }
      if (upstream.ok && !type.includes('text/html')) {
        if (pathname.endsWith('.mp4')) output.set('Content-Type','video/mp4');
        else if (pathname.endsWith('.ts')) output.set('Content-Type','video/mp2t');
        else if (pathname.endsWith('.vtt')) output.set('Content-Type','text/vtt; charset=utf-8');
      }
      return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers: output });
    } catch { return Response.json({ error: 'A origem do vídeo não respondeu. Tente outro servidor.' }, { status: 502 }); }
  }
  return { url, decode, rewrite, handle };
}
