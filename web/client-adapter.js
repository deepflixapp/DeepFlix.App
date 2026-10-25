// client-adapter.js - DEEPFLIX Client-Side Engine 100% Autônomo
// Executado diretamente no navegador (Zero dependência de backend Node / R$ 0,00 de custo)

const GIST_URLS = {
  filme: 'https://gist.githubusercontent.com/skyrisk/5b87797329c7b46422565ffbaab3be7e/raw/page.xml',
  serie: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/SeriesBase',
  anime: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/AnimesBase',
  dorama: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DoramasBase',
  desenho: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DesenhosBase',
  novela: 'https://gist.githubusercontent.com/skyrisk/07f1f4cd1b203cbf2efec959c4e8645a/raw/novelas.xml',
  canais: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/724314f19365a9b0d37511b82e4ec72c89d639a3/channels.xml',
  documentarios: 'https://gist.githubusercontent.com/skyrisk/5b87797329c7b46422565ffbaab3be7e/raw/page.xml',
  programas: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/SeriesBase',
  shows: 'https://gist.githubusercontent.com/skyrisk/5b87797329c7b46422565ffbaab3be7e/raw/page.xml',
};

const RESOLVER_API_HOSTS = ['api.geekantenado.online', 'geekantenado.fly.dev'];
const RESOLVER_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyZXNvbHZlciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc5MDk4OTczfQ.WzQBuOqMai96Afleh9g-i7NXo6h-YsjPUbOgxlUqVsU';

const _clientCache = new Map();
let _iptvConfig = { hosts: {}, users: {} };

function cleanTitleText(raw = '') {
  return String(raw || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/\[CR\]/gi, ' ')
    .replace(/\[\/?(?:B|I|COLOR(?:\s+[^\]]+)?|UPPERCASE|LOWERCASE)\]/gi, '')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => {
      const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
      return code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, n) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[n])
    .trim();
}

function b64DecodeUnicode(str) {
  try {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch {
    try {
      return atob(str);
    } catch {
      return '';
    }
  }
}

function b64EncodeUnicode(str) {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
  } catch {
    return btoa(str);
  }
}

// Brazuca Resolver client-side
async function callBrazucaResolver(paramsStr) {
  const payload = encodeURIComponent(b64EncodeUnicode(paramsStr));
  for (const host of RESOLVER_API_HOSTS) {
    try {
      const res = await fetch(`https://${host}/?resolver=${payload}`, {
        headers: { Authorization: `Bearer ${RESOLVER_API_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.result || data.success)) return data;
      }
    } catch {}
  }
  return { success: false, error: 'Sem resposta dos resolvedores' };
}

// Classificação de canais de TV
const CHANNEL_RULES = [
  { category: 'Canais Abertos', slug: 'canais-abertos', terms: ['BAND', 'GLOBO', 'RECORD', 'RPC', 'SBT'], exclude: /SPORTS|NEWS|GLOBOSAT/ },
  { category: 'Esportes', slug: 'esportes', terms: ['BAND SPORTS', 'COMBATE', 'CONMEBOL', 'ESPN', 'FOX SPORTS', 'PREMIERE', 'SPORTV', 'NOSSO FUTEBOL', 'NSPORTS', 'CAZETV', 'PARAMOUNT+'], exclude: /UNIVERSAL/ },
  { category: 'Filmes e Séries', slug: 'filmes-e-series', terms: ['A&E', 'AMC', 'AXN', 'CINEMAX', 'FOX', 'FX', 'HBO', 'MEGAPIX', 'PARAMOUNT', 'PRIME VIDEO', 'SONY', 'SPACE', 'STAR', 'SYFY', 'TELECINE', 'TNT', 'USA NETWORK', 'UNIVERSAL', 'WARNER', 'STUDIO UNIVERSAL', 'TCM'], exclude: /SPORTS|BBB/ },
  { category: 'Documentários', slug: 'documentarios', terms: ['ANIMAL PLANET', 'DISCOVERY CHANNEL', 'DISCOVERY SCIENCE', 'DISCOVERY TURBO', 'DISCOVERY WORLD', 'H2', 'HISTORY', 'NAT GEO', 'CURTA'], exclude: /KIDS|HBO/ },
  { category: 'Infantil', slug: 'infantil', terms: ['BOOMERANG', 'CARTOON NETWORK', 'CARTOONITO', 'DISNEY', 'GLOOB', 'GLOOBINHO', 'KIDS', 'NICK', 'TOONCAST', 'DREAMWORKS', 'TV RA TIM BUM'], exclude: null },
  { category: 'Variedades', slug: 'variedades', terms: ['ARTE 1', 'BIS', 'CANAL BRASIL', 'CANAL OFF', 'CANAL RURAL', 'COMEDY', 'DISCOVERY HOME', 'E!', 'FISH TV', 'FOOD', 'FOOD NETWORK', 'GLOBOSAT', 'GNT', 'HGTV', 'ID', 'LIFETIME', 'MODO VIAGEM', 'MTV', 'MULTISHOW', 'TBS', 'TERRA', 'TLC', 'TRUTV', 'VIVA', 'SABOR & ARTE'], exclude: /KIDS|GLOBO|RECORD/ },
  { category: 'Notícias', slug: 'noticias', terms: ['BAND NEWS', 'CNN', 'GLOBO NEWS', 'RECORD NEWS', 'JOVEM PAN', 'BM&C'], exclude: null },
  { category: 'Reality Shows', slug: 'reality-shows', terms: ['A FAZENDA', 'BBB', 'CASA DO PATR', 'POWER COUPLE', 'ESTRELA DA CASA'], exclude: null },
];
const ADULT_TERMS = ['ANGELS', 'PLAYBOY', 'HUSTLER', 'EXXXOTICA', 'PENTHOUSE', 'SEXY HOT', 'SEXTREME', 'VENUS', 'SEX PRIVE', 'O-LA-LA', 'HOT PLEASURE', 'HOT XXL', 'REALITY KINGS', 'BRAZZERS', 'ADULTO', 'CANAIS +18'];

function classifyChannel(title = '') {
  const upper = title.toUpperCase();
  if (ADULT_TERMS.some(t => upper.includes(t))) return null;
  for (const rule of CHANNEL_RULES) {
    if (rule.terms.some(t => upper.includes(t)) && (!rule.exclude || !rule.exclude.test(upper))) {
      return { category: rule.category, category_slug: rule.slug };
    }
  }
  return { category: 'Variedades', category_slug: 'variedades' };
}

// Parser completo de Canais XML
function parseChannelsGistXml(xmlText = '') {
  const hosts = {};
  for (const m of xmlText.matchAll(/<hostname_(\d+)>([\s\S]*?)<\/hostname_\1>/g)) {
    hosts[m[1]] = b64DecodeUnicode(m[2].trim());
  }
  const users = {};
  for (const m of xmlText.matchAll(/<users_(\d+)>([\s\S]*?)<\/users_\1>/g)) {
    users[m[1]] = b64DecodeUnicode(m[2].trim()).split('|').filter(Boolean);
  }
  _iptvConfig = { hosts, users };

  const rawChannels = [];
  for (const sectionMatch of xmlText.matchAll(/<channel_(\d+)>([\s\S]*?)<\/channel_\1>/g)) {
    const serverNum = Number(sectionMatch[1]);
    const sectionXml = sectionMatch[2];
    for (const itemMatch of sectionXml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = itemMatch[1];
      const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
      const thumb = block.match(/<thumbnail>([\s\S]*?)<\/thumbnail>/)?.[1] || '';
      if (!link || rawTitle.includes('|||') || link.length <= 3) continue;

      const nameMatch = rawTitle.match(/\[COLOR white\](.*?)\[\/COLOR\]/i);
      const name = cleanTitleText(nameMatch ? nameMatch[1] : rawTitle);
      const qualMatch = rawTitle.match(/\[COLOR (?:gold|skyblue)\](.*?)\[\/COLOR\]/i);
      const quality = cleanTitleText(qualMatch ? qualMatch[1] : 'HD');

      const classification = classifyChannel(name);
      if (!classification) continue;

      rawChannels.push({
        id: `tv-${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`,
        title: name,
        name: name,
        kind: 'canais',
        __kind: 'canais',
        category: classification.category,
        category_slug: classification.category_slug,
        poster_path: thumb,
        thumbnail: thumb,
        streamUrl: link,
        servers: [{
          label: `Servidor ${serverNum}${quality ? ` · ${quality}` : ''}`,
          quality,
          server: serverNum,
          route: link,
        }],
      });
    }
  }

  // Deduplicação de canais por nome
  const byName = new Map();
  for (const ch of rawChannels) {
    const key = ch.name.toUpperCase();
    if (!byName.has(key)) {
      byName.set(key, { ...ch });
    } else {
      const existing = byName.get(key);
      for (const srv of ch.servers) {
        if (!existing.servers.some(s => s.route === srv.route)) {
          existing.servers.push(srv);
        }
      }
    }
  }

  return Array.from(byName.values());
}

window.fetchGistDirect = async function(category) {
  if (_clientCache.has(category)) return _clientCache.get(category);
  const url = GIST_URLS[category];
  if (!url) return [];

  try {
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) return [];
    const rawText = await res.text();

    if (category === 'canais') {
      const channels = parseChannelsGistXml(rawText);
      _clientCache.set('canais', channels);
      return channels;
    }

    const sanitizedXml = rawText.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/gi, '&amp;');
    const parser = new DOMParser();
    const xml = parser.parseFromString(sanitizedXml, 'text/xml');
    const tagName = (category === 'filme' || category === 'documentarios' || category === 'shows') ? 'item' : 'channel';
    const elements = xml.querySelectorAll(tagName);
    const items = [];

    elements.forEach((el, idx) => {
      const rawTitle = el.querySelector('title')?.textContent?.trim() || el.querySelector('name')?.textContent?.trim() || '';
      const title = cleanTitleText(rawTitle);

      if (!title || /PR[OÓ]XIMA\s*P[AÁ]GINA|P[AÁ]GINA\s*\d+|CANAIS\s*\+18|ADULTO/i.test(title)) {
        return;
      }

      const thumb = el.querySelector('thumbnail')?.textContent?.trim() || el.querySelector('poster')?.textContent?.trim() || el.querySelector('logo')?.textContent?.trim() || '';
      const desc = cleanTitleText(el.querySelector('description')?.textContent?.trim() || '');
      const link = el.querySelector('link')?.textContent?.trim() || 
                   el.querySelector('externallink')?.textContent?.trim() ||
                   el.querySelector('stream_url')?.textContent?.trim() || '';
      const cat = el.querySelector('category')?.textContent?.trim() || category;

      items.push({
        id: `${category}_${idx}`,
        title,
        poster_path: thumb,
        thumbnail: thumb,
        overview: desc,
        streamUrl: link,
        category: cat,
        __kind: category,
      });
    });

    _clientCache.set(category, items);
    return items;
  } catch (err) {
    console.error('Erro ao ler gist client-side:', err);
    return [];
  }
};

window.resolvePlayClient = async function(kind, id, season = 1, episode = 1) {
  const items = await window.fetchGistDirect(kind);
  const found = items.find(it => it.id === id || String(it.id) === String(id)) || items[0];

  if (!found) {
    return { options: [] };
  }

  const rawRoute = found.streamUrl || '';

  // 1. Canais de TV
  if (kind === 'canais') {
    if (rawRoute.startsWith('chresolver1=')) {
      const val = rawRoute.slice('chresolver1='.length);
      if (val.includes('#')) {
        const [channelCode, serverId] = val.split('#');
        const hostTemplate = _iptvConfig.hosts?.[serverId] || 'http://srcine.site:80/live/%s/%s.m3u8';
        const users = _iptvConfig.users?.[serverId] || ['62677/62677'];
        const chosenUser = users[0] || '62677/62677';
        const streamUrl = hostTemplate.replace('%s', chosenUser).replace('%s', channelCode);
        return {
          title: found.title,
          category: found.category || 'Canais de TV',
          poster: found.poster_path,
          options: [{
            server: `IPTV ${serverId}`,
            label: `Servidor ${serverId} (Ao Vivo)`,
            url: streamUrl,
            type: 'hls',
            audio: 'Ao Vivo'
          }]
        };
      }
    }
    return {
      title: found.title,
      category: found.category || 'Canais de TV',
      poster: found.poster_path,
      options: [{
        server: 'Principal',
        label: 'Ao Vivo (Direto)',
        url: rawRoute,
        type: 'hls',
        audio: 'Ao Vivo'
      }]
    };
  }

  // 2. Filmes
  if (kind === 'filme' || kind === 'documentarios' || kind === 'shows') {
    const routes = rawRoute.replace(/^#movies_list=/, '').split('|');
    const r3Route = routes.find(r => r.startsWith('resolver3_mv='));
    if (r3Route) {
      const slug = r3Route.slice('resolver3_mv='.length);
      const apiRes = await callBrazucaResolver(`{'resolver': 3, 'request': 'mvshows=${slug}'}`);
      if (apiRes && apiRes.result) {
        const streamUrl = b64DecodeUnicode(apiRes.result).trim();
        if (streamUrl && /^https?:\/\//i.test(streamUrl)) {
          return {
            title: found.title,
            category: found.category,
            poster: found.poster_path,
            options: [{
              server: 'Principal',
              label: 'Servidor Principal (Dublado/HD)',
              url: streamUrl,
              type: streamUrl.includes('.m3u8') ? 'hls' : 'mp4',
              audio: 'Dublado'
            }]
          };
        }
      }
    }

    const r2Route = routes.find(r => r.startsWith('resolver2_mv='));
    if (r2Route) {
      const slug = r2Route.slice('resolver2_mv='.length);
      const apiRes = await callBrazucaResolver(`{'resolver': 2, 'request': 'mvshows=${slug}'}`);
      if (apiRes && apiRes.result) {
        const streamUrl = b64DecodeUnicode(apiRes.result).trim();
        if (streamUrl && /^https?:\/\//i.test(streamUrl)) {
          return {
            title: found.title,
            category: found.category,
            poster: found.poster_path,
            options: [{
              server: 'Alternativo',
              label: 'Servidor Alternativo',
              url: streamUrl,
              type: streamUrl.includes('.m3u8') ? 'hls' : 'mp4',
              audio: 'Dublado'
            }]
          };
        }
      }
    }
  }

  // 3. Séries, Animes, Doramas, Novelas
  if (['serie', 'anime', 'dorama', 'novela', 'desenho', 'programas'].includes(kind)) {
    const routes = rawRoute.replace(/^#(?:series|animes|doramas|novelas)_list=/, '').split('|');
    const r2Route = routes.find(r => r.startsWith('resolver2_tvshows='));
    if (r2Route) {
      const link = r2Route.slice('resolver2_tvshows='.length);
      const reqId = link.includes('#') ? link : `series#${link}`;
      const apiRes = await callBrazucaResolver(`{'resolver': 2, 'request': 'tvshows=${reqId}'}`);
      if (apiRes && apiRes.result) {
        const dec = b64DecodeUnicode(apiRes.result);
        try {
          const seasons = JSON.parse(dec);
          if (Array.isArray(seasons)) {
            const currentSeason = seasons.find(s => Number(s.season_number) === season) || seasons[0];
            const ep = currentSeason?.episodes?.find(e => Number(e.episode_number) === episode) || currentSeason?.episodes?.[0];
            if (ep && ep.link) {
              return {
                title: found.title,
                category: found.category,
                poster: found.poster_path,
                options: [{
                  server: 'Principal',
                  label: `T${season}:E${episode} - ${ep.episode_name || 'Episódio'}`,
                  url: ep.link,
                  type: ep.link.includes('.m3u8') ? 'hls' : 'mp4',
                  audio: 'Dublado'
                }]
              };
            }
          }
        } catch {}
      }
    }
  }

  // Fallback direto se o link for uma URL executável
  if (/^https?:\/\//i.test(rawRoute)) {
    return {
      title: found.title,
      category: found.category,
      poster: found.poster_path,
      options: [{
        server: 'Principal',
        label: 'Principal (Direto)',
        url: rawRoute,
        type: rawRoute.includes('.m3u8') ? 'hls' : 'mp4',
        audio: 'Original'
      }]
    };
  }

  return { options: [] };
};

// Navegação Client-Side Interceptada para evitar 404 ao clicar nos links do menu
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="/"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('//') || href.startsWith('/api/') || link.hasAttribute('download') || link.target === '_blank') {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, '', href);

    // Mapeamento de rotas para o estado interno do app.js
    const routeMap = {
      '/': 'all',
      '/filmes': 'filme',
      '/series': 'serie',
      '/animes': 'anime',
      '/doramas': 'dorama',
      '/desenhos': 'desenho',
      '/novelas': 'novela',
      '/documentarios': 'documentarios',
      '/programas': 'programas',
      '/shows': 'shows',
      '/canais': 'canais',
      '/favoritos': 'favoritos',
      '/historico': 'historico',
    };

    const targetKind = routeMap[href];
    if (targetKind && typeof window.applyKindRoute === 'function') {
      window.applyKindRoute(targetKind);
    } else {
      window.location.reload();
    }
  });
});
