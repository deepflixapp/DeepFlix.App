// Catalog/provider engine adapted from the DEEPFLIX Node backend.
// Request-independent state is scoped to one Worker environment; never serve this file as an asset.
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { createMediaProxy, safeFetch } from './proxy.mjs';
export function createBackend(env, fetcher = fetch) {
const TMDB_API_KEY = env.TMDB_API_KEY || '';
const TMDB_READ_TOKEN = env.TMDB_READ_TOKEN || '';
const RESOLVER_API_TOKEN = env.BRAZUCA_RESOLVER_TOKEN || '';
const RESOLVER_API_HOSTS = ['api.geekantenado.online', 'geekantenado.fly.dev'];
let OVERFLIX_ORIGIN = env.OVERFLIX_ORIGIN || 'https://www.overflix.press';
let overflixOriginExpires = 0;
let overflixOriginPending = null;
async function ensureOverflixOrigin() {
  if (overflixOriginExpires > Date.now()) return OVERFLIX_ORIGIN;
  if (!overflixOriginPending) overflixOriginPending = (async () => {
    const response = await fetchWithDnsFallback(OVERFLIX_ORIGIN, { headers:{'User-Agent':DEFAULT_UA}, signal:AbortSignal.timeout(12000) });
    try {
      if (!response.ok) throw new Error(`HTTP ${response.status} na origem Overflix.`);
      OVERFLIX_ORIGIN = new URL(response.url || OVERFLIX_ORIGIN).origin;
      overflixOriginExpires = Date.now()+1800000;
      return OVERFLIX_ORIGIN;
    } finally { await response.body?.cancel(); }
  })();
  try { return await overflixOriginPending; } finally { overflixOriginPending = null; }
}
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';
const titleCollator = new Intl.Collator('pt-BR');
const EMBED_HOSTS = new Set(['mixdrop.top','mixdrop.ps','mxdrop.click','streamtape.com','bysebuho.com','playmogo.com','myvidplay.com']);
const media = createMediaProxy(env, fetcher);
const buildProxiedUrl = media.url;
const fetchWithDnsFallback = (url, options = {}) => safeFetch(url, options, fetcher);
function sendJson(response, status, payload, headers = {}) {
  response.result = new Response(JSON.stringify(payload, (key, value) => ['routes','route','iptvConfig'].includes(key) ? undefined : value), { status, headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...headers } });
}
const GIST_SOURCES = {
  filme: { url: 'https://gist.githubusercontent.com/skyrisk/5b87797329c7b46422565ffbaab3be7e/raw/page.xml', tag: 'item' },
  serie: { url: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/SeriesBase', tag: 'channel' },
  anime: { url: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/AnimesBase', tag: 'channel' },
  dorama: { url: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DoramasBase', tag: 'channel' },
  desenho: { url: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DesenhosBase', tag: 'channel' },
  novela: { url: 'https://gist.githubusercontent.com/skyrisk/07f1f4cd1b203cbf2efec959c4e8645a/raw/novelas.xml', tag: 'channel' },
};
const CHANNELS_GIST_URL = 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/724314f19365a9b0d37511b82e4ec72c89d639a3/channels.xml';

const PLATFORM_SLUGS = ['netflix', 'hbo-max', 'prime-video', 'disney-plus', 'apple-tv-plus', 'paramount-plus', 'globoplay', 'crunchyroll'];
const PLATFORM_PROVIDER_IDS = {
  'netflix': 8,
  'hbo-max': 1899,
  'prime-video': 119,
  'disney-plus': 337,
  'apple-tv-plus': 350,
  'paramount-plus': 531,
  'globoplay': 307,
  'crunchyroll': 283,
};
const PLATFORM_NAMES_MAP = {
  'netflix': 'netflix',
  'hbo max': 'hbo-max',
  'hbo-max': 'hbo-max',
  'max': 'hbo-max',
  'prime video': 'prime-video',
  'prime-video': 'prime-video',
  'amazon prime video': 'prime-video',
  'disney+': 'disney-plus',
  'disney-plus': 'disney-plus',
  'disney plus': 'disney-plus',
  'apple tv+': 'apple-tv-plus',
  'apple-tv-plus': 'apple-tv-plus',
  'apple tv': 'apple-tv-plus',
  'paramount+': 'paramount-plus',
  'paramount-plus': 'paramount-plus',
  'paramount plus': 'paramount-plus',
  'globoplay': 'globoplay',
  'crunchyroll': 'crunchyroll',
};

const PLATFORM_KINDS = ['filmes', 'series', 'animes', 'doramas', 'novelas', 'desenhos'];
const SITEMAP_ROUTES = [
  '/', '/filmes', '/series', '/animes', '/doramas', '/desenhos', '/novelas',
  '/documentarios', '/programas', '/shows',
  '/canais', '/favoritos', '/historico', '/mapa',
  ...PLATFORM_SLUGS.map(slug => `/plataforma/${slug}`),
  ...PLATFORM_SLUGS.flatMap(slug => PLATFORM_KINDS.map(kind => `/plataforma/${slug}/${kind}`)),
];

const MEDIA_CATEGORIES = new Set(['filme', 'movie', 'serie', 'series', 'anime', 'animes', 'dorama', 'doramas', 'desenho', 'desenhos', 'novela', 'novelas', 'documentarios', 'programas', 'shows']);
const CATEGORY_NORM = {
  filme: 'filme', movie: 'filme', movies: 'filme', filmes: 'filme',
  serie: 'serie', series: 'serie',
  anime: 'anime', animes: 'anime',
  dorama: 'dorama', doramas: 'dorama',
  desenho: 'desenho', desenhos: 'desenho',
  novela: 'novela', novelas: 'novela',
  documentarios: 'documentarios', documentario: 'documentarios',
  programas: 'programas', programa: 'programas', reality: 'programas', 'reality-shows': 'programas',
  shows: 'shows', show: 'shows', musica: 'shows',
  canal: 'canais', canais: 'canais', channel: 'canais', channels: 'canais',
  channel_categories: 'channel_categories',
  pesquisa: 'pesquisa', busca: 'pesquisa', search: 'pesquisa', all: 'pesquisa',
};


const httpCache = new Map();
const tmdbCache = new Map();
const providerTmdbSets = new Map();
const seriesProviderCache = new Map();
const providerDiagnostics = new Map();
function providerDiagnostic(route, error) {
  const message = String(error?.message || '');
  const status = Number(message.match(/HTTP (\d{3})/)?.[1]) || null;
  const cause = String(error?.cause?.code || error?.code || '');
  const transport = /Muitos redirecionamentos/i.test(message) ? 'REDIRECT_LIMIT' : /Redirecionamento sem destino/i.test(message) ? 'REDIRECT_WITHOUT_LOCATION' : /Destino de m.dia inv.lido/i.test(message) ? 'DESTINATION_REJECTED' : /Porta de m.dia inv.lida/i.test(message) ? 'PORT_REJECTED' : /network connection|fetch failed|dns|certificate|tls|ssl|internal error; reference/i.test(message) ? 'NETWORK_OR_TLS' : null;
  if (/^(movie2|serie3)=/.test(route) && error && !transport && !status) {
    console.warn('Overflix transport:',message.replace(/https?:\/\/\S+/g,'[origin]').replace(/[A-Za-z0-9_-]{32,}/g,'[redacted]').slice(0,200));
  }
  return { provider:String(route || '').split('=')[0], code:status ? `UPSTREAM_HTTP_${status}` : error?.name === 'SyntaxError' ? 'UPSTREAM_FORMAT_CHANGED' : /timeout|abort/i.test(message) ? 'UPSTREAM_TIMEOUT' : error ? 'UPSTREAM_REQUEST_FAILED' : 'NO_EPISODES_OR_OPTIONS', ...(status ? {status} : {}), ...(error ? {errorType:error.name || 'Error'} : {}), ...(transport ? {transport} : {}), ...(/^[A-Z_0-9]{2,60}$/.test(cause) ? {cause} : {}) };
}
const iptvVerifiedAccounts = new Map();
const playResolutionCache = new Map();

function setPlayResolutionCache(cacheKey, payload, ttlMs) {
  if (!payload || !Array.isArray(payload.options) || !payload.options.length) return;
  const now = Date.now();
  if (playResolutionCache.size > 300) {
    for (const [k, v] of playResolutionCache.entries()) {
      if (v.expiresAt <= now) playResolutionCache.delete(k);
    }
    if (playResolutionCache.size > 250) {
      const excess = playResolutionCache.size - 250;
      let count = 0;
      for (const k of playResolutionCache.keys()) {
        playResolutionCache.delete(k);
        count++;
        if (count >= excess) break;
      }
    }
  }
  playResolutionCache.set(cacheKey, { payload, expiresAt: now + ttlMs });
}

const store = {
  source: 'local-snapshot',
  updatedAt: '',
  catalog: { filme: [], serie: [], anime: [], dorama: [], desenho: [], novela: [] },
  byKindAndId: new Map(),
  byTmdb: new Map(),
  channels: [],
  iptvConfig: { hosts: {}, users: {} },
};

function cleanXmlText(value = '') {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/\[CR\]/gi, '\n')
    .replace(/\[\/?(?:B|I|COLOR(?:\s+[^\]]+)?|UPPERCASE|LOWERCASE)\]/gi, '')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => {
      const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
      return code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, n) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[n])
    .trim();
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value = '') {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseInfoBlock(infoText = '') {
  let rating = '';
  let genres = [];
  let release = '';
  let synopsis = '';
  for (const line of String(infoText || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const mRating = trimmed.match(/^Avalia[cç][aã]o:\s*(.+)$/i);
    if (mRating) { rating = mRating[1].trim(); continue; }
    const mGenre = trimmed.match(/^G[eê]neros?:\s*(.+)$/i);
    if (mGenre) { genres = mGenre[1].split(/,|&/).map(g => g.trim()).filter(Boolean); continue; }
    const mRel = trimmed.match(/^Lan[cç]amento:\s*(.+)$/i);
    if (mRel) { release = mRel[1].trim(); continue; }
    const mSyn = trimmed.match(/^Sinopse:\s*(.+)$/i);
    if (mSyn) { synopsis = mSyn[1].trim(); continue; }
    if (synopsis) synopsis += ' ' + trimmed;
    else synopsis = trimmed;
  }
  return { rating, genres, release, synopsis };
}

function parseCatalogXml(xml, kind, tag) {
  const items = [];
  const byId = new Map();
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g');
  let legacyIndex = -1;
  for (const match of xml.matchAll(regex)) {
    legacyIndex++;
    const block = match[1];
    const get = key => cleanXmlText(block.match(new RegExp(`<${key}>([\\s\\S]*?)<\\/${key}>`))?.[1]);
    const rawTitle = get(tag === 'item' ? 'title' : 'name') || get('title');
    const tmdbTitle = get('tmdb_title') || get('tmdb_name');
    const title = tmdbTitle || rawTitle;
    const links = [...block.matchAll(/<link>([\s\S]*?)<\/link>/g)].map(m => cleanXmlText(m[1]));
    const source = get('externallink') || links.filter(x => x !== 'here').join('|');
    if (!title || !source || source.startsWith('#movies_pages=') || source.startsWith('#series_pages=')) continue;
    if (/CANAIS\s*\+18|ADULT/i.test(rawTitle) || source.includes('pornhub') || source.includes('hub_')) continue;
    const routes = source.replace(/^#(?:movies|series|doramas|novelas|animes)_list=/, '').split('|').map(r => r.trim()).filter(Boolean);
    if (!routes.length) continue;
    const tmdb = get('tmdb_id');
    const contentId = get('content_id');
    const id = (/^\d+$/.test(tmdb) ? tmdb : '') || contentId || `${kind}-${crypto.createHash('sha256').update(source).digest('hex').slice(0, 20)}`;
    if (byId.has(id)) {
      const existing = byId.get(id);
      for (const r of routes) if (!existing.routes.includes(r)) existing.routes.push(r);
      existing.aliases.push(`${kind}_${legacyIndex}`);
      continue;
    }
    const info = get('info');
    const parsedInfo = parseInfoBlock(info);
    const date = get('date') || get('tmdb_date') || parsedInfo.release;
    const year = date.match(/(\d{4})/)?.[1] || '';
    let thumb = get('thumbnail');
    if (thumb && !thumb.startsWith('http') && !thumb.startsWith('movie=')) {
      try {
        const dec = Buffer.from(thumb, 'base64').toString('utf8');
        if (dec.startsWith('http')) thumb = dec;
      } catch {}
    }
    if (thumb.startsWith('movie=') && thumb.includes('.mp4')) {
      const mvid = thumb.split('movie=')[1].replace('.mp4', '');
      thumb = `https://filmesonlinevizer.com/content/movies/posterPt/342/${mvid}.webp`;
    }
    const genreTag = get('genre');
    const genres = parsedInfo.genres.length ? parsedInfo.genres : (genreTag ? genreTag.split(',').map(g => g.trim()).filter(Boolean) : []);
    const item = {
      id: String(id),
      aliases: [`${kind}_${legacyIndex}`],
      tmdb_id: /^\d+$/.test(tmdb) ? String(tmdb) : '',
      kind,
      title,
      original_title: get('tmdb_original_title') || get('tmdb_original_name') || '',
      poster: thumb,
      backdrop: get('fanart'),
      year,
      date,
      vote_average: parsedInfo.rating ? Number(parsedInfo.rating) || parsedInfo.rating : '',
      genres,
      overview: parsedInfo.synopsis || '',
      routes,
    };
    byId.set(id, item);
    items.push(item);
  }
  return items;
}

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
const ADULT_CHANNEL_TERMS = ['ANGELS', 'PLAYBOY', 'HUSTLER', 'EXXXOTICA', 'PENTHOUSE', 'SEXY HOT', 'SEXTREME', 'VENUS', 'SEX PRIVE', 'O-LA-LA', 'HOT PLEASURE', 'HOT XXL', 'REALITY KINGS', 'BRAZZERS', 'ADULTO'];

function classifyChannel(title = '') {
  const upper = title.toUpperCase();
  if (ADULT_CHANNEL_TERMS.some(t => upper.includes(t))) return null;
  for (const rule of CHANNEL_RULES) {
    if (rule.terms.some(t => upper.includes(t)) && (!rule.exclude || !rule.exclude.test(upper))) {
      return { category: rule.category, category_slug: rule.slug };
    }
  }
  return { category: 'Variedades', category_slug: 'variedades' };
}

function parseChannelVariantInfo(rawName = '') {
  let clean = String(rawName || '').trim();
  const variantMatch = clean.match(/\s+((?:FULL\s+)?(?:H\.?264|H\.?265|HEVC|FHD|UHD|4K|HD|SD|ALT|BACKUP|OP\d+))$/i);
  const variantTag = variantMatch ? variantMatch[1].trim().toUpperCase().replace(/\./g, '') : '';
  if (variantMatch) {
    clean = clean.slice(0, variantMatch.index).trim();
  }
  if (clean.toUpperCase() === 'BISS') clean = 'BIS';

  // Unify regional affiliates for major open networks (Globo, SBT, Band, Record)
  let regionTag = '';
  const upper = clean.toUpperCase().trim();
  const nonAffiliates = ['GLOBO NEWS', 'BAND NEWS', 'BAND SPORTS', 'RECORD NEWS', 'PLUTO TV'];
  if (!nonAffiliates.some(n => upper.includes(n))) {
    const globoAffiliatesRegex = /^((?:RPC|NCP|NSC|RBS)(?:\s+TV)?|EPTV|TV\s+TEM|TV\s+VANGUARDA|TV\s+TRIBUNA|INTER\s*TV|TV\s+MORENA|TV\s+ANHANGUERA|REDE\s+AMAZ[OÔ]NICA|REDE\s+CLUBE|TV\s+LIBERAL|TV\s+MIRANTE|TV\s+SERGIPE|TV\s+CENTRO\s+AM[EÉ]RICA)(?:\s+(.*))?$/i;
    const globoAffMatch = upper.match(globoAffiliatesRegex);
    if (globoAffMatch) {
      const pfx = (globoAffMatch[1] || 'RPC').trim().replace(/\s+TV$/i, '');
      const city = (globoAffMatch[2] || '').trim();
      regionTag = city ? `${pfx} ${city}` : pfx;
      clean = 'GLOBO';
    } else {
      const networks = ['GLOBO', 'SBT', 'BAND', 'RECORD'];
      for (const net of networks) {
        if (upper === net) {
          clean = net;
          break;
        }
        if (upper.startsWith(net + ' ')) {
          regionTag = clean.slice(net.length).trim();
          clean = net;
          break;
        }
      }
    }
  }

  const canonicalKey = clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  return { baseName: clean, variantTag, regionTag, canonicalKey };
}

function deduplicateChannelsList(rawChannels = []) {
  const grouped = new Map();
  for (const ch of rawChannels) {
    if (!ch || !ch.name) continue;
    const { baseName, variantTag, regionTag, canonicalKey } = parseChannelVariantInfo(ch.name);
    if (!canonicalKey) continue;
    const classification = ch.category_slug === 'pluto-tv'
      ? { category: ch.category || 'Pluto TV', category_slug: 'pluto-tv' }
      : classifyChannel(baseName);
    if (!classification) continue;

    if (!grouped.has(canonicalKey)) {
      grouped.set(canonicalKey, {
        id: ch.category_slug === 'pluto-tv' ? ch.id : `tv-${slugify(baseName)}`,
        aliases: new Set([ch.id, `tv-${slugify(baseName)}`, ...(ch.aliases || [])].filter(Boolean)),
        name: baseName,
        kind: 'canais',
        category: classification.category,
        category_slug: classification.category_slug,
        subcategory: ch.subcategory || '',
        overview: ch.overview || '',
        poster: ch.poster || '',
        backdrop: ch.backdrop || '',
        servers: [],
        seenRoutes: new Set(),
      });
    } else {
      const existing = grouped.get(canonicalKey);
      if (ch.id) existing.aliases.add(ch.id);
      for (const alias of ch.aliases || []) existing.aliases.add(alias);
      const hasAccents = /[À-ÿ]/.test(baseName) && !/[À-ÿ]/.test(existing.name);
      if (hasAccents) existing.name = baseName;
      if (!existing.poster && ch.poster) existing.poster = ch.poster;
      if (!existing.overview && ch.overview) existing.overview = ch.overview;
      if (existing.category_slug === 'pluto-tv' && classification.category_slug !== 'pluto-tv') {
        existing.category = classification.category;
        existing.category_slug = classification.category_slug;
      }
    }

    const entry = grouped.get(canonicalKey);
    for (const srv of ch.servers || []) {
      if (!srv || !srv.route || entry.seenRoutes.has(srv.route)) continue;
      entry.seenRoutes.add(srv.route);
      const qual = variantTag || srv.quality || '';
      const effectiveRegion = regionTag || srv.region || '';
      let label = '';
      if (effectiveRegion) {
        label = qual ? `${effectiveRegion} (${qual})` : effectiveRegion;
        if (entry.servers.some(s => s.label === label)) {
          let count = 2;
          while (entry.servers.some(s => s.label === `${label} ${count}`)) count++;
          label = `${label} ${count}`;
        }
      } else {
        const num = entry.servers.length + 1;
        label = qual ? `Servidor ${num} (${qual})` : `Servidor ${num}`;
      }
      entry.servers.push({
        ...srv,
        label,
        region: effectiveRegion,
        quality: qual,
      });
    }
  }

  return [...grouped.values()].map(ch => ({
    id: ch.id,
    aliases: [...ch.aliases],
    name: ch.name,
    kind: 'canais',
    category: ch.category,
    category_slug: ch.category_slug,
    subcategory: ch.subcategory,
    overview: ch.overview,
    poster: ch.poster,
    backdrop: ch.backdrop,
    server_count: ch.servers.length,
    servers: ch.servers,
  })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
}

function parseChannelsXml(xml = '') {
  const hosts = {};
  for (const m of xml.matchAll(/<hostname_(\d+)>([\s\S]*?)<\/hostname_\1>/g)) {
    hosts[m[1]] = Buffer.from(m[2].trim(), 'base64').toString('utf8');
  }
  const users = {};
  for (const m of xml.matchAll(/<users_(\d+)>([\s\S]*?)<\/users_\1>/g)) {
    users[m[1]] = Buffer.from(m[2].trim(), 'base64').toString('utf8').split('|').filter(Boolean);
  }
  const rawItems = [];
  for (const sectionMatch of xml.matchAll(/<channel_(\d+)>([\s\S]*?)<\/channel_\1>/g)) {
    const serverNum = Number(sectionMatch[1]);
    const sectionXml = sectionMatch[2];
    for (const itemMatch of sectionXml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = itemMatch[1];
      const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      const link = cleanXmlText(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
      const thumb = cleanXmlText(block.match(/<thumbnail>([\s\S]*?)<\/thumbnail>/)?.[1] || '');
      if (!link || rawTitle.includes('|||') || link.length <= 3) continue;
      const nameMatch = rawTitle.match(/\[COLOR white\](.*?)\[\/COLOR\]/i);
      const name = cleanXmlText(nameMatch ? nameMatch[1] : rawTitle);
      const qualMatch = rawTitle.match(/\[COLOR (?:gold|skyblue)\](.*?)\[\/COLOR\]/i);
      const quality = cleanXmlText(qualMatch ? qualMatch[1] : 'HD');
      const classification = classifyChannel(name);
      if (!classification) continue;
      rawItems.push({
        id: `tv-${slugify(name)}`,
        name,
        kind: 'canais',
        category: classification.category,
        category_slug: classification.category_slug,
        poster: thumb,
        servers: [{
          label: `Servidor ${serverNum}${quality ? ` · ${quality}` : ''}`,
          quality,
          server: serverNum,
          route: link,
        }],
      });
    }
  }
  return {
    iptvConfig: { hosts, users },
    channels: deduplicateChannelsList(rawItems),
  };
}

function getSortableReleaseDate(item) {
  const s = String(item?.date || item?.release_date || item?.first_air_date || '').trim();
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) return `${m2[1]}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`;
  const y = String(item?.year || s).match(/(\d{4})/)?.[1];
  return y ? `${y}-00-00` : '0000-00-00';
}

function cleanMediaTitleKey(title = '') {
  return String(title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\(\[\{]?(?:dublado|legendado|dub|leg|nacional|dual[\s\-_]?audio)[\)\]\}]?/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function deduplicateMediaCatalog(items = []) {
  const byTmdb = new Map();
  const byTitleYear = new Map();
  const deduped = [];

  for (const item of items) {
    if (!item) continue;
    const cleanKey = cleanMediaTitleKey(item.title);
    const yearKey = item.year || '';
    const titleKey = cleanKey && yearKey ? `${cleanKey}:${yearKey}` : null;
    const tmdbKey = item.tmdb_id ? String(item.tmdb_id) : null;

    let target = null;
    if (tmdbKey && byTmdb.has(tmdbKey)) {
      target = byTmdb.get(tmdbKey);
    } else if (titleKey && byTitleYear.has(titleKey)) {
      target = byTitleYear.get(titleKey);
    }

    if (target) {
      if (!target.aliases) target.aliases = new Set([target.id].filter(Boolean));
      if (item.id) target.aliases.add(item.id);
      for (const alias of item.aliases || []) target.aliases.add(alias);
      for (const r of item.routes || []) {
        if (!target.routes.includes(r)) target.routes.push(r);
      }
      if (!target.tmdb_id && item.tmdb_id) target.tmdb_id = item.tmdb_id;
      if (!target.poster && item.poster) target.poster = item.poster;
      if (!target.backdrop && item.backdrop) target.backdrop = item.backdrop;
      if (!target.overview && item.overview) target.overview = item.overview;
      if (!target.date && item.date) target.date = item.date;
      if (item.genres && Array.isArray(item.genres)) {
        for (const g of item.genres) {
          if (!target.genres.includes(g)) target.genres.push(g);
        }
      }
      continue;
    }

    // Reuse parsed records: cloning every record retains two full catalogs
    // while rebuilding indexes in a memory-limited Worker isolate.
    const entry = item;
    entry.routes ||= [];
    entry.aliases = new Set([item.id, ...(item.aliases || [])].filter(Boolean));
    if (tmdbKey) byTmdb.set(tmdbKey, entry);
    if (titleKey) byTitleYear.set(titleKey, entry);
    deduped.push(entry);
  }

  for (const item of deduped) item.aliases = Array.from(item.aliases || []);
  return deduped;
}

function rebuildCatalogIndexes() {
  store.byKindAndId.clear();
  store.byTmdb.clear();
  for (const [kind, list] of Object.entries(store.catalog)) {
    const dedupedList = deduplicateMediaCatalog(list);
    store.catalog[kind] = dedupedList;
    dedupedList.sort((a, b) => {
      const diff = getSortableReleaseDate(b).localeCompare(getSortableReleaseDate(a));
      if (diff !== 0) return diff;
      return titleCollator.compare(String(a.title || a.name || ''), String(b.title || b.name || ''));
    });
    for (const item of dedupedList) {
      store.byKindAndId.set(`${kind}:${item.id}`, item);
      for (const alias of item.aliases || []) {
        store.byKindAndId.set(`${kind}:${alias}`, item);
      }
      if (item.tmdb_id) {
        store.byKindAndId.set(`${kind}:${item.tmdb_id}`, item);
        const tmdbKind = kind === 'filme' ? 'movie' : 'tv';
        const key = `${tmdbKind}:${item.tmdb_id}`;
        if (!store.byTmdb.has(key)) store.byTmdb.set(key, []);
        store.byTmdb.get(key).push(item);
      }
    }
  }
  store.channels = deduplicateChannelsList(store.channels);
  for (const ch of store.channels) {
    store.byKindAndId.set(`canais:${ch.id}`, ch);
    for (const alias of ch.aliases || []) {
      store.byKindAndId.set(`canais:${alias}`, ch);
    }
  }

}


async function cachedTextFetch(url, options = {}, ttlMs = 120000, bypassCache = false) {
  const target = url instanceof URL ? url : new URL(url);
  const key = `${options.method || 'GET'}:${target.href}:${options.body || ''}`;
  if (!bypassCache) {
    const hit = httpCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.body;
  }
  const response = await fetchWithDnsFallback(target, {
    ...options,
    headers: { 'User-Agent': DEFAULT_UA, ...(options.headers || {}) },
    signal: options.signal || AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao consultar ${target.hostname}.`);
  const body = await response.text();
  if (body.length < 15000000) {
    httpCache.set(key, { body, expiresAt: Date.now() + ttlMs });
    if (httpCache.size > 200) httpCache.delete(httpCache.keys().next().value);
  }
  return body;
}


async function getTmdb(pathname) {
  if (!TMDB_API_KEY && !TMDB_READ_TOKEN) throw new Error('TMDB não configurado.');
  const cached = tmdbCache.get(pathname);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const url = new URL(`https://api.themoviedb.org/3${pathname}`);
  if (TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);
  const headers = { Accept: 'application/json' };
  if (TMDB_READ_TOKEN) headers.Authorization = `Bearer ${TMDB_READ_TOKEN}`;
  const response = await fetchWithDnsFallback(url, { headers, signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error(`TMDB respondeu com HTTP ${response.status}.`);
  const data = await response.json();
  tmdbCache.set(pathname, { data, expiresAt: Date.now() + 3600000 });
  if (tmdbCache.size > 500) tmdbCache.delete(tmdbCache.keys().next().value);
  return data;
}

const providerQueries = new Map();
async function getProviderCatalogItems(platformSlug, kind, limit = 24) {
  const key = `${platformSlug}:${kind === 'filme' ? 'movie' : 'tv'}`;
  while (providerQueries.has(key)) await providerQueries.get(key).catch(() => {});
  const query = getProviderCatalogItemsUnlocked(platformSlug,kind,limit);
  providerQueries.set(key,query);
  try { return await query; } finally { providerQueries.delete(key); }
}
async function getProviderCatalogItemsUnlocked(platformSlug, kind, limit = 24) {
  const providerId = PLATFORM_PROVIDER_IDS[platformSlug];
  if (!providerId) return [];
  const list = store.catalog[kind] || [];
  if (!TMDB_API_KEY && !TMDB_READ_TOKEN) {
    throw new Error('TMDB não configurado para consultar plataformas.');
  }
  const tmdbType = kind === 'filme' ? 'movie' : 'tv';
  const cacheKey = `${platformSlug}:${tmdbType}`;
  let entry = providerTmdbSets.get(cacheKey);
  if (!entry || entry.expiresAt < Date.now()) {
    entry = { ids: new Set(), fetchedPages: 0, totalPages: 1, expiresAt: Date.now() + 3600000 };
    providerTmdbSets.set(cacheKey, entry);
  }
  const matched = [];
  const seenIds = new Set();
  const collectMatches = () => {
    for (const tmdbId of entry.ids) {
      const candidates = store.byTmdb.get(`${tmdbType}:${tmdbId}`) || [];
      for (const item of candidates) {
        if (item.kind === kind && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          matched.push({ ...item, platforms: [platformSlug] });
        }
      }
    }
  };
  collectMatches();
  while (entry.fetchedPages < Math.min(entry.totalPages, 50)) {
    const startPage = entry.fetchedPages + 1;
    const pagesBatch = [startPage, startPage + 1].filter(p => p <= entry.totalPages && p <= 50);
    if (!pagesBatch.length) break;
    const results = await Promise.allSettled(
      pagesBatch.map(page => getTmdb(`/discover/${tmdbType}?watch_region=BR&with_watch_providers=${providerId}&language=pt-BR&sort_by=popularity.desc&page=${page}`))
    );
    for (const res of results) {
      if (res.status === 'fulfilled' && res.value) {
        entry.fetchedPages++;
        entry.totalPages = Math.min(50, Number(res.value.total_pages) || 1);
        for (const r of res.value.results || []) {
          if (r?.id) entry.ids.add(String(r.id));
        }
      }
    }
    collectMatches();
    if (results.some(r => r.status === 'rejected')) {
      entry.fetchedPages = startPage - 1;
      throw new Error('A plataforma não respondeu por completo. Tente novamente.');
    }
  }
  return matched;
}

let cinemaTmdbEntry = null;

async function getCinemaCatalogItems(limit = 50) {
  const list = store.catalog.filme || [];
  if (!TMDB_API_KEY && !TMDB_READ_TOKEN) {
    return list.filter(item => !(item.genres || []).some(g => normalizeText(g) === 'cinema tv'));
  }
  if (!cinemaTmdbEntry || cinemaTmdbEntry.expiresAt < Date.now()) {
    cinemaTmdbEntry = { ids: new Set(), fetchedPages: 0, totalPages: 30, expiresAt: Date.now() + 3600000 };
  }
  const matched = [];
  const seenIds = new Set();
  const collectMatches = () => {
    for (const tmdbId of cinemaTmdbEntry.ids) {
      const candidates = store.byTmdb.get(`movie:${tmdbId}`) || [];
      for (const item of candidates) {
        if (item.kind === 'filme' && !seenIds.has(item.id)) {
          seenIds.add(item.id);
          matched.push(item);
        }
      }
    }
  };

  collectMatches();

  if (cinemaTmdbEntry.fetchedPages === 0) {
    try {
      const np = await getTmdb('/movie/now_playing?language=pt-BR&region=BR&page=1');
      for (const r of np?.results || []) {
        if (r?.id) cinemaTmdbEntry.ids.add(String(r.id));
      }
    } catch {}
  }

  const maxPagesToFetch = Math.min(cinemaTmdbEntry.totalPages, 30);
  while ( cinemaTmdbEntry.fetchedPages < maxPagesToFetch && cinemaTmdbEntry.fetchedPages < 30) {
    const startPage = cinemaTmdbEntry.fetchedPages + 1;
    const pagesBatch = [startPage, startPage + 1, startPage + 2].filter(p => p <= cinemaTmdbEntry.totalPages && p <= 30);
    if (!pagesBatch.length) break;
    const results = await Promise.allSettled(
      pagesBatch.map(page => getTmdb(`/discover/movie?with_release_type=2|3&language=pt-BR&sort_by=popularity.desc&page=${page}`))
    );
    for (const res of results) {
      cinemaTmdbEntry.fetchedPages++;
      if (res.status === 'fulfilled' && res.value) {
        cinemaTmdbEntry.totalPages = Math.min(30, Number(res.value.total_pages) || 1);
        for (const r of res.value.results || []) {
          if (r?.id) cinemaTmdbEntry.ids.add(String(r.id));
        }
      }
    }
    collectMatches();
  }

  if (matched.length === 0) {
    return list.filter(item => !(item.genres || []).some(g => normalizeText(g) === 'cinema tv'));
  }
  return matched;
}

async function getActorCatalogMatches(actorQuery, allowedKinds = null) {
  const cleanActor = String(actorQuery || '').trim();
  if (!cleanActor || (!TMDB_API_KEY && !TMDB_READ_TOKEN)) {
    return { matched: [], actorInfo: null };
  }
  const searchRes = await getTmdb(`/search/person?query=${encodeURIComponent(cleanActor)}&language=pt-BR&include_adult=false`);
  const candidates = (searchRes?.results || []).slice(0, 3);
  if (!candidates.length) {
    return { matched: [], actorInfo: null };
  }
  const primaryPerson = candidates[0];
  const actorInfo = {
    id: primaryPerson.id,
    name: primaryPerson.name,
    profile_path: primaryPerson.profile_path || '',
    known_for_department: primaryPerson.known_for_department || '',
  };

  const creditsList = await Promise.allSettled(
    candidates.map(person => getTmdb(`/person/${person.id}/combined_credits?language=pt-BR`))
  );

  const matched = [];
  const seenKeys = new Set();
  const kindFilterSet = allowedKinds ? new Set(allowedKinds) : null;

  for (const credRes of creditsList) {
    if (credRes.status !== 'fulfilled' || !credRes.value) continue;
    const allCredits = [...(credRes.value.cast || []), ...(credRes.value.crew || []).filter(c => c.job === 'Director')];
    for (const credit of allCredits) {
      if (!credit?.id) continue;
      const tmdbType = credit.media_type === 'tv' ? 'tv' : 'movie';
      const catalogItems = store.byTmdb.get(`${tmdbType}:${credit.id}`) || [];
      for (const item of catalogItems) {
        if (kindFilterSet && !kindFilterSet.has(item.kind)) continue;
        const uniqueKey = `${item.kind}:${item.id}`;
        if (!seenKeys.has(uniqueKey)) {
          seenKeys.add(uniqueKey);
          matched.push({
            ...item,
            actor_character: credit.character || credit.job || '',
            actor_name: primaryPerson.name,
          });
        }
      }
    }
  }

  return { matched, actorInfo };
}

function withTimeout(promise, ms) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}

// --- BrazucaPlay Resolvers ---
async function callBrazucaResolverApi(paramsStr, bypassCache = false) {
  const payload = encodeURIComponent(Buffer.from(paramsStr, 'utf8').toString('base64'));
  const fetchHost = async (host) => {
    const body = await cachedTextFetch(`https://${host}/?resolver=${payload}`, {
      headers: { Authorization: `Bearer ${RESOLVER_API_TOKEN}` },
      signal: AbortSignal.timeout(3800),
    }, 600000, bypassCache);
    const data = JSON.parse(body);
    if (data && (data.result || data.success)) return data;
    throw new Error('Sem resultado');
  };
  try {
    return await Promise.any(RESOLVER_API_HOSTS.map(h => fetchHost(h)));
  } catch {}
  return { success: false, error: 'not found' };
}

function decodeBase64Result(resObj) {
  if (!resObj || !resObj.result || resObj.result === 'API Under Maintenance' || resObj.result === 'episode not found!') return '';
  try {
    return Buffer.from(String(resObj.result), 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function extractOverflixPlayers(data) {
  const result = [];
  for (const [field, audio] of [['servers_dub', 'Dublado'], ['servers_leg', 'Legendado']]) {
    const ids = new URLSearchParams(String(data?.[field] || '').replace(/&amp;/g, '&'));
    for (const player of data?.players || []) {
      const label = String(player.label || '');
      const id = ids.get(label.toLowerCase());
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) continue;
      let base;
      try { base = new URL(player.url); } catch { continue; }
      if (base.protocol !== 'https:' || !EMBED_HOSTS.has(base.hostname) || base.username || base.password) continue;
      result.push({
        label: `Overflix · ${label}`,
        server: label,
        audio,
        kind: 'iframe',
        url: base.href.replace(/\/?$/, '/') + id,
      });
    }
  }
  return result;
}

async function resolveOverflixPlayerData(videoId, referer) {
  const endpoint = new URL('/index.php', OVERFLIX_ORIGIN);
  for (const [k, v] of Object.entries({ app: 'videobox', module: 'video', controller: 'view', do: 'playerData', id: videoId })) {
    endpoint.searchParams.set(k, v);
  }
  let body = await cachedTextFetch(endpoint, {
    headers: { Referer: referer, 'X-Requested-With': 'XMLHttpRequest' },
  }, 60000);
  let data = JSON.parse(body);
  if (data.redirect) {
    body = await cachedTextFetch(new URL(data.redirect, OVERFLIX_ORIGIN), {
      headers: { Referer: referer, 'X-Requested-With': 'XMLHttpRequest' },
    }, 60000);
    data = JSON.parse(body);
  }
  return extractOverflixPlayers(data);
}

async function resolveBloggerVideo(webUrl) {
  try {
    const html = await cachedTextFetch(webUrl, {}, 120000);
    if (!html || html.includes('<div class="errorMessage">')) return null;
    const wizMatch = html.match(/window\.WIZ_global_data\s*=\s*(\{[\s\S]*?\});/);
    if (!wizMatch) return null;
    const wizData = JSON.parse(wizMatch[1]);
    const sid = wizData.FdrFJe;
    const token = new URL(webUrl).searchParams.get('token');
    if (!sid || !token) return null;
    const fReq = `[[["WcwnYd","[\\"${token}\\",\\"\\",0]","null","generic"]]]`;
    const postUrl = `https://www.blogger.com/_/BloggerVideoPlayerUi/data/batchexecute?rpcids=WcwnYd&source-path=%2Fvideo.g&f.sid=${encodeURIComponent(sid)}`;
    const body = new URLSearchParams({ 'f.req': fReq }).toString();
    const res = await fetchWithDnsFallback(postUrl, {
      method: 'POST',
      headers: {
        'User-Agent': DEFAULT_UA,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Origin': 'https://www.blogger.com',
        'Referer': 'https://www.blogger.com/',
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    let txt = await res.text();
    if (txt.startsWith(")]}'")) txt = txt.slice(4);
    const outer = JSON.parse(txt.trim());
    for (const item of outer) {
      if (Array.isArray(item) && item.length > 2 && item[1] === 'WcwnYd') {
        const inner = JSON.parse(item[2]);
        const streams = inner?.[2] || [];
        streams.sort((a, b) => Math.max(...(b[1] || [0])) - Math.max(...(a[1] || [0])));
        for (const s of streams) {
          if (s[0] && Array.isArray(s[1]) && s[1].some(tag => ['18', '22', '37'].includes(String(tag)))) {
            return buildProxiedUrl(s[0], { Referer: webUrl, 'User-Agent': DEFAULT_UA });
          }
        }
      }
    }
  } catch {}
  return null;
}

async function resolveSingleRoutePlay(route, audioFallback = 'Dublado', bypassCache = false) {
  const callResolver = params => callBrazucaResolverApi(params,bypassCache);
  const fetchText = (url, options = {}, ttl = 120000) => cachedTextFetch(url,options,ttl,bypassCache);
  const options = [];
  const cleanRoute = String(route || '').trim();
  if (!cleanRoute) return options;

  // 1. Overflix movie2 / serie3
  if (cleanRoute.startsWith('movie2=') || cleanRoute.startsWith('serie3=')) {
    await ensureOverflixOrigin();
    const isMovie = cleanRoute.startsWith('movie2=');
    const slug = cleanRoute.slice(cleanRoute.indexOf('=') + 1).replace(/^https?:\/\/[^/]+\/(?:filmes|series)\/online\//i, '').replace(/\/+$/, '');
    const videoId = slug.match(/-(\d+)$/)?.[1];
    if (videoId) {
      const referer = `${OVERFLIX_ORIGIN}/${isMovie ? 'filmes' : 'series'}/online/${slug}/`;
      const players = await resolveOverflixPlayerData(videoId, referer);
      options.push(...players);
    }
    return options;
  }

  // 2. Resolver 3 (movie or episode)
  if (cleanRoute.startsWith('resolver3_mv=') || cleanRoute.startsWith('resolver3_episodes=')) {
    const isEp = cleanRoute.startsWith('resolver3_episodes=');
    const val = cleanRoute.slice(cleanRoute.indexOf('=') + 1);
    const langFromRoute = isEp ? (val.split('#')[3] || audioFallback) : audioFallback;
    const reqParam = isEp ? `episodes=${val}` : `mvshows=${val}`;
    const apiRes = await callResolver(`{'resolver': 3, 'request': '${reqParam}'}`);
    const stream = decodeBase64Result(apiRes).trim();
    if (stream && /^https?:\/\//i.test(stream)) {
      const isHls = stream.includes('.m3u8');
      options.push({
        label: `Servidor Principal · ${langFromRoute}`,
        server: 'Principal',
        audio: langFromRoute,
        kind: isHls ? 'hls' : 'video',
        url: buildProxiedUrl(stream),
      });
    }
    return options;
  }

  // 3. Resolver 2 (movie or episode)
  if (cleanRoute.startsWith('resolver2_mv=') || cleanRoute.startsWith('resolver2_episodes=')) {
    const isEp = cleanRoute.startsWith('resolver2_episodes=');
    const val = cleanRoute.slice(cleanRoute.indexOf('=') + 1);
    let stream = '';
    if (isEp && /^https?:\/\//i.test(val)) {
      stream = val;
    } else {
      const apiRes = await callResolver(`{'resolver': 2, 'request': 'mvshows=${val}'}`);
      stream = decodeBase64Result(apiRes).trim();
    }
    if (stream && /^https?:\/\//i.test(stream)) {
      const isHls = stream.includes('.m3u8');
      options.push({
        label: `Servidor Alternativo · ${audioFallback}`,
        server: 'Alternativo',
        audio: audioFallback,
        kind: isHls ? 'hls' : 'video',
        url: buildProxiedUrl(stream),
      });
    }
    return options;
  }

  // 4. Resolver 1 (movie or episode)
  if (cleanRoute.startsWith('resolver1_mv=') || cleanRoute.startsWith('resolver1_episodes=')) {
    const isEp = cleanRoute.startsWith('resolver1_episodes=');
    const val = cleanRoute.slice(cleanRoute.indexOf('=') + 1);
    const reqParam = isEp ? `episodes=${val}` : `mvshows=${val}`;
    const apiRes = await callResolver(`{'resolver': 1, 'request': '${reqParam}'}`);
    const decoded = decodeBase64Result(apiRes).trim();
    if (decoded && /^https?:\/\//i.test(decoded)) {
      const [streamPart, subPart] = decoded.split('#');
      options.push({
        label: `Servidor R1 · ${audioFallback}`,
        server: 'R1',
        audio: audioFallback,
        kind: streamPart.includes('.m3u8') ? 'hls' : 'video',
        url: buildProxiedUrl(streamPart),
        subtitle: subPart ? buildProxiedUrl(subPart) : '',
      });
    }
    return options;
  }

  // 5. Resolver 4 & 5
  if (cleanRoute.startsWith('resolver4_') || cleanRoute.startsWith('resolver5_')) {
    const num = cleanRoute.startsWith('resolver4_') ? 4 : 5;
    const isEp = cleanRoute.includes('_episodes=');
    const val = cleanRoute.slice(cleanRoute.indexOf('=') + 1);
    const reqParam = isEp ? `episodes=${val}` : `mvshows=${val}`;
    const apiRes = await callResolver(`{'resolver': ${num}, 'request': '${reqParam}'}`);
    const decoded = decodeBase64Result(apiRes).trim();
    if (decoded) {
      const [streamUrl] = decoded.split('|');
      if (/^https?:\/\//i.test(streamUrl)) {
        options.push({
          label: `Servidor R${num} · ${audioFallback}`,
          server: `R${num}`,
          audio: audioFallback,
          kind: streamUrl.includes('.m3u8') ? 'hls' : 'video',
          url: buildProxiedUrl(decoded),
        });
      }
    }
    return options;
  }

  // 6. Animes3 episode page
  if (cleanRoute.startsWith('animes3_ep=') || cleanRoute.includes('animesonlinecc.to/episodio/')) {
    const epUrl = cleanRoute.replace(/^animes3_ep=/, '');
    const rawHtml = await fetchText(epUrl, {}, 120000);
    const html = rawHtml
      .replace(/class="icon-play_arrow"><\/b> /g, 'class="icon-play_arrow"></b>')
      .replace(/ <\/a><\/li>/g, '</a></li>');
    const links = [...html.matchAll(/<div id="option-[\s\S]*?src="([^"]+)"[\s\S]*?<\/div>/gi)].map(m => m[1]);
    const langs = [...html.matchAll(/<li><a class="options[\s\S]*?<b class="icon-play_arrow"><\/b>([\s\S]*?)<\/a><\/li>/gi)].map(m => cleanXmlText(m[1]));
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const langLabel = langs[i] || 'Legendado';
      const audio = /dub/i.test(langLabel) ? 'Dublado' : 'Legendado';
      if (link.includes('blogger.com')) {
        const proxiedMp4 = await resolveBloggerVideo(link);
        if (proxiedMp4) {
          options.push({
            label: `AnimePlayer · ${langLabel}`,
            server: 'Blogger',
            audio,
            kind: 'video',
            url: proxiedMp4,
          });
          continue;
        }
      }
      options.push({
        label: `Player Externo · ${langLabel}`,
        server: 'Embed',
        audio,
        kind: 'iframe',
        url: link,
      });
    }
    return options;
  }

  // 7. DoramasOnline episode page
  if (cleanRoute.startsWith('doramas_resolver1=')) {
    const epUrl = cleanRoute.slice('doramas_resolver1='.length);
    if (!epUrl.startsWith('http')) return options;
    const html = (await fetchText(epUrl, {}, 120000)).replace(/'/g, '"').replace(/="\/\//g, '="https://');
    const hosts = [...html.matchAll(/<div id="source-player[^"]*"[^>]*>[\s\S]*?(?:<iframe[^>]*src="|<a[^>]*href=")([^"]+)[\s\S]*?<\/div>/gi)].map(m => m[1]);
    let idx = 1;
    for (let player of hosts) {
      try {
        if (player.includes('.php?auth=')) {
          const b64 = player.split('.php?auth=')[1];
          const dec = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
          if (dec.url) player = decodeURIComponent(dec.url);
        }
        if (player.includes('/aviso/?url=')) {
          player = decodeURIComponent(player.split('url=')[1]);
        }
        if (player.includes('/daycdn/')) {
          player = `https://www.dailymotion.com/embed/video/${player.split('key=')[1]}`;
        }
        if (/rumble\.com|mega\.nz|q1n\.net|doramas\.upns\.ink/i.test(player)) continue;
        if (player.includes('sk-boyceta')) {
          const u = new URL(player);
          const skOrigin = `${u.protocol}//${u.host}`;
          const skJsonStr = await fetchText(`${player}&mode=to-salvando-seu-ip`, {
            headers: { Referer: player },
          }, 60000);
          const skData = JSON.parse(skJsonStr);
          const midias = skData.midias || [];
          if (midias.length) {
            const best = midias[0];
            if (best?.url) {
              options.push({
                label: `DoramaServer ${idx++} · Legendado`,
                server: `SK-${idx}`,
                audio: 'Legendado',
                kind: best.url.includes('.m3u8') ? 'hls' : 'video',
                url: buildProxiedUrl(best.url, { Origin: skOrigin, Referer: `${skOrigin}/` }),
              });
              continue;
            }
          }
        }
        if (player.includes('ru-boyceta')) {
          const u = new URL(player);
          const idParam = u.searchParams.get('id');
          if (idParam && idParam.endsWith('.mp4')) {
            const playerHtml = await fetchText(player, { headers: { Referer: 'https://doramasonline.net/' } }, 60000);
            const fileMatch = playerHtml.match(/["']file["']\s*:\s*["'](https?:\/\/[^"']+)["']/i) || playerHtml.match(/src\s*:\s*["'](https?:\/\/[^"']+)["']/i);
            if (fileMatch) {
              const streamUrl = fileMatch[1].replace(/\\\//g, '/');
              options.push({
                label: `DoramaServer ${idx++} · Legendado`,
                server: `RU-${idx}`,
                audio: 'Legendado',
                kind: streamUrl.includes('.m3u8') ? 'hls' : 'video',
                url: buildProxiedUrl(streamUrl, { Referer: player }),
              });
              continue;
            }
          }
        }
        if (player.startsWith('https://csst.online')) {
          const csstHtml = await fetchText(player, { headers: { Referer: 'https://doramasonline.net/' } }, 60000);
          const fileMatches = [...csstHtml.matchAll(/file:"([^"]+)"/g)].map(m => m[1]);
          if (fileMatches.length) {
            let rawFile = fileMatches[fileMatches.length - 1];
            if (rawFile.includes(']')) {
              const parts = rawFile.split(',').map(s => s.replace(/^\[.*?\]/, '').trim()).filter(Boolean);
              if (parts.length) rawFile = parts[parts.length - 1];
            }
            if (/^https?:\/\//i.test(rawFile)) {
              const refOrigin = new URL(rawFile).origin;
              options.push({
                label: `CSST · Legendado`,
                server: 'CSST',
                audio: 'Legendado',
                kind: rawFile.includes('.m3u8') ? 'hls' : 'video',
                url: buildProxiedUrl(rawFile, { Referer: refOrigin }),
              });
              continue;
            }
          }
        }
        options.push({
          label: `Player ${idx++} · Legendado`,
          server: `Embed ${idx}`,
          audio: 'Legendado',
          kind: 'iframe',
          url: player.split('&poster=')[0].split('?thumbnail=')[0],
        });
      } catch {}
    }
    return options;
  }

  // 8. Novelas (novefx / painel.novefx.biz)
  if (cleanRoute.startsWith('novelas_play=')) {
    const epUrl = cleanRoute.slice('novelas_play='.length);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
      'Referer': 'https://esportesdavez.com/',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
    };
    const epHtml = await fetchText(epUrl, { headers }, 60000);
    const mIframe = epHtml.match(/<iframe\s*src="([^"]+)/i);
    if (mIframe) {
      const iframeUrl = mIframe[1];
      const streamId = iframeUrl.split('/').pop();
      const iframeOrigin = new URL(iframeUrl).origin;
      const payloadOrigin = new URL(epUrl).origin;
      const body = new URLSearchParams({ op: 'embed', file_code: streamId, auto: '1', referer: payloadOrigin }).toString();
      const dlRes = await fetchWithDnsFallback(`${iframeOrigin}/dl`, {
        method: 'POST',
        headers: {
          ...headers,
          Origin: iframeOrigin,
          Referer: iframeUrl,
          'Sec-Fetch-Site': 'same-origin',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(12000),
      });
      const dlHtml = await dlRes.text();
      const m3u8Match = dlHtml.match(/["'](https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)["']/i)
        || dlHtml.match(/(?:file|source|src|playbackUrl)\s*:\s*["'](https?:\/\/[^"']+)["']/i);
      if (m3u8Match) {
        options.push({
          label: 'Servidor Novelas · Nacional',
          server: 'NoveFX',
          audio: 'Dublado',
          kind: m3u8Match[1].includes('.m3u8') ? 'hls' : 'video',
          url: buildProxiedUrl(m3u8Match[1], { Referer: `${iframeOrigin}/`, Origin: iframeOrigin, 'User-Agent': headers['User-Agent'] }),
        });
      } else {
        options.push({
          label: 'Player Externo · Nacional',
          server: 'Embed',
          audio: 'Dublado',
          kind: 'iframe',
          url: iframeUrl,
        });
      }
    }
    return options;
  }

  // 9. Pluto TV live channel
  if (cleanRoute.startsWith('plutotv=')) {
    const channelUrl = cleanRoute.slice('plutotv='.length);
    try {
      const parsed = new URL(channelUrl);
      const pathParts = parsed.pathname.split('/');
      const chIdx = pathParts.indexOf('channel');
      const channelId = chIdx >= 0 ? pathParts[chIdx + 1] : '';
      const deviceId = parsed.searchParams.get('deviceId') || '44319783-8c70-4536-a9be-cc7de27ba2f5';
      const sid = parsed.searchParams.get('sid') || '44319783-8c70-11ef-a9be-cc7de27ba2f5';
      const now = new Date();
      const clientTime = now.toISOString();
      const launchTime = new Date(now.getTime() - 12000).toISOString();

      const bootUrl = new URL('https://boot.pluto.tv/v4/start');
      for (const [k, v] of Object.entries({
        appName: 'web',
        appVersion: '9.21.0-bf9f5b4369933742859f3b2581c935110922f642',
        deviceVersion: '148.0.0',
        deviceModel: 'web',
        deviceMake: 'edge-chromium',
        deviceType: 'web',
        clientID: deviceId,
        clientModelNumber: '1.0.0',
        channelID: channelId,
        serverSideAds: 'false',
        drmCapabilities: 'widevine:L3',
        blockingMode: '',
        notificationVersion: '1',
        appLaunchCount: '5',
        lastAppLaunchDate: launchTime,
        clientTime,
      })) bootUrl.searchParams.set(k, v);

      const bootRes = await fetchWithDnsFallback(bootUrl, {
        headers: {
          'User-Agent': DEFAULT_UA,
          'Referer': 'https://pluto.tv/',
          'Origin': 'https://pluto.tv',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (bootRes.ok) {
        const bootData = await bootRes.json();
        const jwt = bootData.sessionToken;
        if (jwt) {
          let baseStitch = channelUrl.split('?')[0];
          if (!baseStitch.includes('/v2/stitch/')) baseStitch = baseStitch.replace('/stitch/', '/v2/stitch/');
          const finalUrl = `${baseStitch}?advertisingId=&appName=web&appVersion=9.21.0-bf9f5b4369933742859f3b2581c935110922f642&app_name=web&clientDeviceType=0&clientID=${deviceId}&clientModelNumber=1.0.0&country=BR&deviceDNT=false&deviceId=${deviceId}&deviceLat=-18.9500&deviceLon=-48.2400&deviceMake=edge-chromium&deviceModel=web&deviceType=web&deviceVersion=148.0.0&marketingRegion=BR&serverSideAds=false&sessionID=${sid}&sid=${sid}&userId=&includeExtendedEvents=true&eventVOD=false&jwt=${encodeURIComponent(jwt)}&masterJWTPassthrough=true`;
          options.push({
            label: 'Pluto TV · Ao Vivo',
            server: 'Pluto TV',
            audio: 'Ao Vivo',
            kind: 'hls',
            url: buildProxiedUrl(finalUrl, { Referer: 'https://pluto.tv/', Origin: 'https://pluto.tv' }),
          });
          return options;
        }
      }
    } catch {}
    options.push({
      label: 'Pluto TV · Ao Vivo',
      server: 'Pluto TV',
      audio: 'Ao Vivo',
      kind: 'hls',
      url: buildProxiedUrl(channelUrl, { Referer: 'https://pluto.tv/', Origin: 'https://pluto.tv' }),
    });
    return options;
  }

  // IPTV credentials and upstream checks stay on the Worker.
  if (cleanRoute.startsWith('chresolver1=')) {
    const [channelCode, serverId] = cleanRoute.slice(12).split('#');
    const template = store.iptvConfig.hosts[serverId];
    const accounts = store.iptvConfig.users[serverId] || [];
    if (!template || !channelCode) return [];
    const results = await Promise.allSettled(accounts.map(async account => {
      const url = template.replace('%s', account).replace('%s', channelCode);
      const response = await fetchWithDnsFallback(url, { headers: { 'User-Agent': 'XC-IPTV' }, signal: AbortSignal.timeout(5000) });
      if (!response.ok) { await response.body?.cancel(); return null; }
      const text = await response.text();
      return text.trimStart().startsWith('#EXTM3U') ? { kind: 'hls', audio: 'Ao Vivo', server: `IPTV ${serverId}`, url: buildProxiedUrl(url, { 'User-Agent': 'XC-IPTV' }) } : null;
    }));
    return results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
  }
  if (/^https?:\/\//i.test(cleanRoute)) return [{ kind: /\.m3u8(?:[?#]|$)/i.test(cleanRoute) ? 'hls' : 'video', audio: audioFallback, server: 'Direto', url: buildProxiedUrl(cleanRoute) }];

  return options;
}

// --- Series / Episodic Provider Scraping ---
async function fetchBrazucaSeriesProviderData(item, bypassCache = false) {
  const callResolver = params => callBrazucaResolverApi(params,bypassCache);
  const fetchText = (url, options = {}, ttl = 120000) => cachedTextFetch(url,options,ttl,bypassCache);
  const cacheKey = `${item.kind}:${item.id}`;
  const cached = seriesProviderCache.get(cacheKey);
  if (!bypassCache && cached && cached.expiresAt > Date.now()) return cached.seasonsMap;

  const seasonsMap = new Map(); // seasonNumber -> Map(epNumber -> { number, title, routes: [] })
  const ensureEpisode = (sNum, epNum, epTitle = '') => {
    const s = Number(sNum) || 1;
    const e = Number(epNum) || 1;
    if (!seasonsMap.has(s)) seasonsMap.set(s, new Map());
    const epMap = seasonsMap.get(s);
    if (!epMap.has(e)) {
      epMap.set(e, { episode_number: e, name: epTitle || `Episódio ${e}`, routes: [] });
    } else if (epTitle && epMap.get(e).name === `Episódio ${e}`) {
      epMap.get(e).name = epTitle;
    }
    return epMap.get(e);
  };

  const providerResults = await Promise.allSettled((item.routes || []).map(async rawRoute => {
    // 1. resolver3_tvshows / animes2
    if (rawRoute.startsWith('resolver3_tvshows=') || rawRoute.startsWith('animes2=')) {
      const slug = rawRoute.slice(rawRoute.indexOf('=') + 1);
      const apiRes = await callResolver(`{'resolver': 3, 'request': 'tvshows=${slug}'}`);
      const dec = decodeBase64Result(apiRes);
      if (!dec) return;
      const parsed = JSON.parse(dec);
      for (const [tempStr, val] of Object.entries(parsed || {})) {
        const sNum = Number(tempStr) || 1;
        const hasDual = Boolean(val?.has_dual_audio);
        const episodesObj = val?.episodes || {};
        for (const [epNumStr, epInfo] of Object.entries(episodesObj)) {
          const epNum = Number(epNumStr) || 1;
          const epEntry = ensureEpisode(sNum, epNum, epInfo?.title || `Episódio ${epNum}`);
          epEntry.routes.push(`resolver3_episodes=${slug}#${tempStr}#${epNumStr}#Dublado`);
          if (hasDual || epInfo?.dual_audio) {
            epEntry.routes.push(`resolver3_episodes=${slug}#${tempStr}#${epNumStr}#Legendado`);
          }
        }
      }
      return;
    }

    // 2. resolver2_tvshows
    if (rawRoute.startsWith('resolver2_tvshows=')) {
      const link = rawRoute.slice('resolver2_tvshows='.length);
      const reqId = link.includes('#') ? link : `series#${link}`;
      const apiRes = await callResolver(`{'resolver': 2, 'request':'tvshows=${reqId}'}`);
      const dec = decodeBase64Result(apiRes);
      if (!dec || dec === 'null') return;
      const parsed = JSON.parse(dec);
      if (!Array.isArray(parsed)) return;
      for (const seasonObj of parsed) {
        const sNum = Number(seasonObj.season_number) || 1;
        for (const ep of seasonObj.episodes || []) {
          if (!ep?.link) continue;
          const epNum = Number(ep.episode_number) || 1;
          const epEntry = ensureEpisode(sNum, epNum, ep.episode_name || `Episódio ${epNum}`);
          epEntry.routes.push(`resolver2_episodes=${ep.link}`);
        }
      }
      return;
    }

    // 3. serie3 (Overflix)
    if (rawRoute.startsWith('serie3=')) {
      await ensureOverflixOrigin();
      const slug = rawRoute.slice('serie3='.length);
      const id = slug.match(/-(\d+)$/)?.[1];
      if (!id) return;
      const referer = `${OVERFLIX_ORIGIN}/series/online/${slug}/`;
      const html = await fetchText(referer, { headers: { Referer: referer } }, 300000);
      const block = html.match(/<section\b[^>]*class=["'][^"']*vbEpisodes[^"']*["'][\s\S]*?<\/section>/i)?.[0];
      if (!block) return;
      const seasons = [...new Set([...block.matchAll(/data-season=["'](\d+)["']/g)].map(m => m[1]))];
      const audio = /data-audio=["']Dublado["']/.test(html) ? 'Dublado' : block.match(/data-current-audio=["']([^"']+)["']/)?.[1] || 'Legendado';
      const videoId = block.match(/data-video-id=["'](\d+)["']/)?.[1] || id;
      await Promise.allSettled(seasons.map(async sStr => {
        const epEndpoint = new URL('/index.php', OVERFLIX_ORIGIN);
        for (const [k, v] of Object.entries({ app: 'videobox', module: 'video', controller: 'view', do: 'episodesList', id: videoId, season: sStr, audio })) {
          epEndpoint.searchParams.set(k, v);
        }
        let body = await fetchText(epEndpoint, { headers: { Referer: referer, 'X-Requested-With': 'XMLHttpRequest' } }, 300000);
        let data = JSON.parse(body);
        if (data.redirect) {
          body = await fetchText(new URL(data.redirect, OVERFLIX_ORIGIN), { headers: { Referer: referer, 'X-Requested-With': 'XMLHttpRequest' } }, 300000);
          data = JSON.parse(body);
        }
        for (const ep of data.episodes || []) {
          const epId = String(ep.url || '').match(/-(\d+)\/?$/)?.[1];
          if (!epId) continue;
          const epNum = Number(ep.number) || 1;
          const epEntry = ensureEpisode(Number(sStr) || 1, epNum, ep.title || `Episódio ${epNum}`);
          epEntry.routes.push(`serie3=${ep.url}`);
        }
      }));
      return;
    }

    // 4. animes3
    if (rawRoute.startsWith('animes3=')) {
      const slug = rawRoute.slice('animes3='.length);
      const html = await fetchText(`https://animesonlinecc.to/anime/${slug}`, {}, 300000);
      const seasonBlocks = [...html.matchAll(/<div class="se-c"><div class="se-q">[\s\S]+?<span class="title">([\s\S]+?)<\/span>([\s\S]+?)<\/div><\/div>/gi)];
      seasonBlocks.forEach((match, idx) => {
        const sTitle = cleanXmlText(match[1]);
        const sNum = Number(sTitle.match(/(\d+)/)?.[1]) || (idx + 1);
        const eps = [...match[2].matchAll(/<img src="[\s\S]+?">[\s\S]+?<a href="([^"]+)">([\s\S]+?)<\/a>/gi)];
        eps.forEach((epMatch, epIdx) => {
          const epUrl = epMatch[1];
          const epTitle = cleanXmlText(epMatch[2]);
          const epNum = Number(epTitle.match(/(\d+)/)?.[1]) || (epIdx + 1);
          const epEntry = ensureEpisode(sNum, epNum, epTitle);
          epEntry.routes.push(`animes3_ep=${epUrl}`);
        });
      });
      return;
    }

    // 5. doramas_resolver1
    if (rawRoute.startsWith('doramas_resolver1=')) {
      const slug = rawRoute.slice('doramas_resolver1='.length);
      const html = (await fetchText(`https://doramasonline.net/br/series/${slug}/`, {}, 300000))
        .replace(/'/g, '"').replace(/ <\/div>/g, '</div>');
      const seasonBlocks = [...html.matchAll(/<div class="se-c">([\s\S]+?)<\/ul>/gi)].map(m => m[1]).filter(b => !b.includes('<li class="none">'));
      seasonBlocks.forEach((block, idx) => {
        const sNum = idx + 1;
        const eps = [...block.matchAll(/<a href="([^"]+)">([\s\S]+?)<\/a>/gi)];
        eps.forEach((epMatch, epIdx) => {
          const epUrl = epMatch[1];
          const epTitle = cleanXmlText(epMatch[2]);
          const epNum = Number(epTitle.match(/(\d+)/)?.[1]) || (epIdx + 1);
          const epEntry = ensureEpisode(sNum, epNum, epTitle);
          epEntry.routes.push(`doramas_resolver1=${epUrl}`);
        });
      });
      return;
    }

    // 6. novelas
    if (rawRoute.startsWith('novelas=')) {
      const slug = rawRoute.slice('novelas='.length).replace(/-/g, '');
      const html = (await fetchText(`https://novefx.biz/nov/${slug}.php`, {
        headers: { Referer: 'https://saudeefitness.top/' },
      }, 300000)).replace(/\$\{chapterStr\}/g, '');
      const origUrlMatch = html.match(/let\s+originalUrl\s*=\s*`([^`]+)`/);
      const origUrl = origUrlMatch?.[1] || '';
      const tempMatch = html.match(/const\s+temporadas\s*=\s*(\[[\s\S]*?\]);/);
      if (tempMatch && origUrl) {
        const cleanJson = tempMatch[1].replace(/,\s*\]/g, ']').replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
        const temps = JSON.parse(cleanJson);
        temps.forEach((t, idx) => {
          const sNum = Number(String(t.nome || '').match(/(\d+)/)?.[1]) || (idx + 1);
          const start = Number(t.inicio) || 1;
          const end = Number(t.fim) || start;
          for (let c = start; c <= end; c++) {
            const epEntry = ensureEpisode(sNum, c, `Capítulo ${c}`);
            epEntry.routes.push(`novelas_play=${origUrl}${String(c).padStart(3, '0')}`);
          }
        });
      } else if (origUrl) {
        const totalMatch = html.match(/let\s+totalChapters\s*=\s*(\d+)/) || html.match(/chaptersAdded\s*<\s*(\d+)/);
        const total = Number(totalMatch?.[1]) || 0;
        for (let c = 1; c <= total; c++) {
          const epEntry = ensureEpisode(1, c, `Capítulo ${c}`);
          epEntry.routes.push(`novelas_play=${origUrl}${String(c).padStart(3, '0')}`);
        }
      } else if (html.includes('<option value="')) {
        const opts = [...html.matchAll(/<option value="(.*?)">.\s*(.*?)<\/option>/gi)];
        opts.forEach((m, idx) => {
          const epNum = Number(m[2].match(/(\d+)/)?.[1]) || (idx + 1);
          const epEntry = ensureEpisode(1, epNum, cleanXmlText(m[2]));
          epEntry.routes.push(`novelas_play=${m[1]}`);
        });
      }
    }
  }));

  providerDiagnostics.set(cacheKey, providerResults.map((result,index) => providerDiagnostic(item.routes[index],result.status === 'rejected' ? result.reason : null)));
  if (providerDiagnostics.size > 300) providerDiagnostics.delete(providerDiagnostics.keys().next().value);
  if (seasonsMap.size > 0) {
    seriesProviderCache.set(cacheKey, { seasonsMap, expiresAt: Date.now() + 1800000 });
  }
  return seasonsMap;
}


function initialBucketOf(title = '') {
  const clean = String(title || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const first = clean.charAt(0).toUpperCase();
  if (first >= 'A' && first <= 'Z') return first;
  return '0-9';
}

function handleTextSitemapApi(response, requestUrl) {
  const rawKind = (requestUrl.searchParams.get('kind') || 'all').toLowerCase();
  const kind = rawKind === 'all' ? 'all' : (CATEGORY_NORM[rawKind] || 'all');
  const sort = (requestUrl.searchParams.get('sort') || 'az').toLowerCase();
  const letter = (requestUrl.searchParams.get('letter') || '').toUpperCase().trim();
  const yearFilter = (requestUrl.searchParams.get('year') || '').trim();
  const query = normalizeText(requestUrl.searchParams.get('q') || '');
  const limitVal = Number.parseInt(requestUrl.searchParams.get('limit') || '500', 10);
  const limit = Number.isFinite(limitVal) && limitVal > 0 ? Math.min(limitVal, 2000) : 500;
  const page = Math.max(1, Number.parseInt(requestUrl.searchParams.get('page') || '1', 10) || 1);
  const offset = (page - 1) * limit;

  const counts = {
    all: 0,
    filme: (store.catalog.filme || []).length,
    serie: (store.catalog.serie || []).length,
    anime: (store.catalog.anime || []).length,
    dorama: (store.catalog.dorama || []).length,
    desenho: (store.catalog.desenho || []).length,
    novela: (store.catalog.novela || []).length,
    canais: (store.channels || []).length,
  };
  counts.all = counts.filme + counts.serie + counts.anime + counts.dorama + counts.desenho + counts.novela + counts.canais;

  const yearsSet = new Set();
  const pool = [];

  const mediaKinds = ['filme', 'serie', 'anime', 'dorama', 'desenho', 'novela'];
  for (const k of mediaKinds) {
    for (const item of store.catalog[k] || []) {
      if (item.year && /^\d{4}$/.test(item.year)) yearsSet.add(item.year);
      if (kind !== 'all' && kind !== k) continue;
      const title = item.title || item.name || '';
      if (!title) continue;
      const bucket = initialBucketOf(title);
      if (letter && bucket !== letter) continue;
      if (yearFilter) {
        if (yearFilter === 'sem-ano') {
          if (item.year) continue;
        } else if (item.year !== yearFilter) {
          continue;
        }
      }
      if (query && !normalizeText(`${title} ${item.original_title || ''}`).includes(query)) continue;
      pool.push({
        id: item.id,
        kind: k,
        title,
        year: item.year || '',
        letter: bucket,
        href: `/assistir/${k}/${encodeURIComponent(item.id)}${k === 'filme' ? '' : '/1/1'}`,
      });
    }
  }

  if (kind === 'all' || kind === 'canais') {
    for (const ch of store.channels || []) {
      const title = ch.name || '';
      if (!title) continue;
      const bucket = initialBucketOf(title);
      if (letter && bucket !== letter) continue;
      if (yearFilter && yearFilter !== 'sem-ano') continue;
      if (query && !normalizeText(`${title} ${ch.category || ''}`).includes(query)) continue;
      pool.push({
        id: ch.id,
        kind: 'canais',
        title,
        year: '',
        category: ch.category || 'Canal ao Vivo',
        letter: bucket,
        href: `/assistir/canais/${encodeURIComponent(ch.id)}`,
      });
    }
  }

  if (sort === 'za') {
    pool.sort((a, b) => b.title.localeCompare(a.title, 'pt-BR', { numeric: true }));
  } else if (sort === 'year_desc') {
    pool.sort((a, b) => {
      const ya = Number(a.year) || 0;
      const yb = Number(b.year) || 0;
      if (yb !== ya) return yb - ya;
      return a.title.localeCompare(b.title, 'pt-BR', { numeric: true });
    });
  } else if (sort === 'year_asc') {
    pool.sort((a, b) => {
      const ya = Number(a.year) || 9999;
      const yb = Number(b.year) || 9999;
      if (ya !== yb) return ya - yb;
      return a.title.localeCompare(b.title, 'pt-BR', { numeric: true });
    });
  } else {
    pool.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { numeric: true }));
  }

  const years = [...yearsSet].sort((a, b) => Number(b) - Number(a));
  const total = pool.length;
  const results = pool.slice(offset, offset + limit);

  return sendJson(response, 200, {
    results,
    page,
    limit,
    total,
    hasMore: total > offset + limit,
    counts,
    years,
  });
}

async function handleCatalog(request, response, requestUrl) {
  const rawCat = (requestUrl.searchParams.get('category') || '').toLowerCase();
  const category = CATEGORY_NORM[rawCat];
  if (!category) return sendJson(response, 400, { error: 'Categoria de catálogo inválida.' });

  const limitValue = Number.parseInt(requestUrl.searchParams.get('limit') || '24', 10);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 5000) : 24;
  const paginated = requestUrl.searchParams.has('page');
  const page = Math.max(1, Math.min(100000, Number.parseInt(requestUrl.searchParams.get('page'), 10) || 1));
  const offset = (page - 1) * limit;
  const sort = requestUrl.searchParams.get('sort') || '';
  const respond = (items, totalKnown = true, extra = {}) => {
    if (!paginated) return sendJson(response, 200, items.slice(0, limit), { 'X-Catalog-Source': store.source });
    if (sort === 'az') items.sort((a, b) => String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), 'pt-BR'));
    if (sort === 'recent') items.sort((a, b) => {
      const diff = getSortableReleaseDate(b).localeCompare(getSortableReleaseDate(a));
      if (diff !== 0) return diff;
      return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''), 'pt-BR');
    });
    if (sort === 'rating') items.sort((a, b) => Number(b.vote_average || b.rating || 0) - Number(a.vote_average || a.rating || 0));
    if (sort === 'popular') items.sort((a, b) => Number(b.popularity || b.vote_average || 0) - Number(a.popularity || a.vote_average || 0));
    return sendJson(response, 200, { results: items.slice(offset, offset + limit), page, total: totalKnown ? items.length : null, hasMore: items.length > offset + limit, ...extra }, { 'X-Catalog-Source': store.source });
  };
  const query = normalizeText(requestUrl.searchParams.get('q') || '');
  const actorQuery = (requestUrl.searchParams.get('actor') || '').trim();
  const genre = normalizeText(requestUrl.searchParams.get('genero') || requestUrl.searchParams.get('genre') || '');
  const year = (requestUrl.searchParams.get('year') || '').trim();
  const platformParam = (requestUrl.searchParams.get('platform') || '').trim();
  const platformSlug = PLATFORM_NAMES_MAP[platformParam.toLowerCase()] || (PLATFORM_PROVIDER_IDS[platformParam] ? platformParam : '');

  if (category === 'channel_categories') {
    const categories = [
      { name: 'Canais Abertos', slug: 'canais-abertos' },
      { name: 'Esportes', slug: 'esportes' },
      { name: 'Filmes e Séries', slug: 'filmes-e-series' },
      { name: 'Documentários', slug: 'documentarios' },
      { name: 'Infantil', slug: 'infantil' },
      { name: 'Variedades', slug: 'variedades' },
      { name: 'Notícias', slug: 'noticias' },
      { name: 'Reality Shows', slug: 'reality-shows' },
      { name: 'Pluto TV', slug: 'pluto-tv' },
    ];
    return sendJson(response, 200, categories, { 'X-Catalog-Source': store.source });
  }

  if (category === 'canais') {
    const filtered = store.channels
      .filter(ch => !genre || slugify(ch.category_slug || ch.category) === slugify(genre))
      .filter(ch => !query || normalizeText(`${ch.name} ${ch.category} ${ch.subcategory || ''}`).includes(query));
    if (!paginated) return sendJson(response, 200, filtered.slice(0, Math.max(limit, filtered.length)), { 'X-Catalog-Source': store.source });
    return sendJson(response, 200, { results: filtered, page: 1, total: filtered.length, hasMore: false }, { 'X-Catalog-Source': store.source });
  }

  const filterList = (list) => list.filter(item => {
    if (query && !normalizeText(`${item.title} ${item.original_title || ''}`).includes(query)) return false;
    const itemYear = String(item.year || item.release_date || item.first_air_date || item.date || '').slice(0, 4);
    if (year && itemYear !== year) return false;
    if (genre && genre !== 'cinema') {
      const itemGenres = (item.genres || []).map(g => normalizeText(typeof g === 'string' ? g : g.name || ''));
      if (!itemGenres.some(g => g.includes(genre) || slugify(g).includes(slugify(genre)) || (genre === 'ficcao' && /sci.?fi/.test(g)) || (genre === 'suspense' && g.includes('thriller')))) return false;
    }
    return true;
  });

  if (category === 'pesquisa') {
    const requestedKind = CATEGORY_NORM[(requestUrl.searchParams.get('kind') || '').toLowerCase()];
    const kinds = requestedKind && MEDIA_CATEGORIES.has(requestedKind) ? [requestedKind] : ['filme', 'serie', 'anime', 'dorama', 'desenho', 'novela'];
    let pool = [];
    let actorInfo = null;
    if (actorQuery) {
      try {
        const actorRes = await getActorCatalogMatches(actorQuery, kinds);
        pool = actorRes.matched;
        actorInfo = actorRes.actorInfo;
      } catch {}
    } else if (genre === 'cinema') {
      pool = await getCinemaCatalogItems(paginated ? (offset + limit + 1) * 2 : limit * 2);
    } else if (platformSlug) {
      const perKind = await Promise.all(kinds.map(k => getProviderCatalogItems(platformSlug, k, paginated ? offset + limit + 1 : limit)));
      pool = perKind.flat();
    } else {
      for (const k of kinds) pool.push(...(store.catalog[k] || []));
    }
    if (actorQuery && platformSlug) {
      const providerPool = (await Promise.all(kinds.map(k => getProviderCatalogItems(platformSlug,k,5000)))).flat();
      const keys = new Set(providerPool.map(item => `${item.kind}:${item.id}`));
      pool = pool.filter(item => keys.has(`${item.kind}:${item.id}`));
    }
    const matched = filterList(pool);
    return respond(matched, !platformSlug || Boolean(actorQuery), actorInfo ? { actor: actorInfo } : {});
  }

  // Specific media category
  if (category === 'filme' && genre === 'cinema') {
    const cinemaItems = await getCinemaCatalogItems(paginated ? (offset + limit + 1) * 2 : limit * 2);
    const filtered = filterList(cinemaItems);
    return respond(filtered, false);
  }

  if (platformSlug) {
    const providerItems = await getProviderCatalogItems(platformSlug, category, paginated ? (offset + limit + 1) * 2 : limit * 2);
    const filtered = filterList(providerItems);
    const tmdbType = category === 'filme' ? 'movie' : 'tv';
    const cacheEntry = providerTmdbSets.get(`${platformSlug}:${tmdbType}`);
    const exhausted = cacheEntry ? cacheEntry.fetchedPages >= Math.min(cacheEntry.totalPages, 50) : false;
    return respond(filtered, exhausted);
  }

  if (category === 'documentarios') {
    const pool = [...(store.catalog.filme || []), ...(store.catalog.serie || [])];
    const docs = pool.filter(item => (item.genres || []).some(g => normalizeText(g).includes('documentario')));
    const filtered = filterList(docs);
    return respond(filtered);
  }

  if (category === 'programas') {
    const pool = [...(store.catalog.serie || []), ...(store.catalog.filme || [])];
    const realities = pool.filter(item => {
      const g = (item.genres || []).map(x => normalizeText(x));
      return g.some(x => x.includes('reality') || x.includes('talk') || x.includes('politica')) || /bbb|fazenda|masterchef|reality|power couple|de ferias com/i.test(item.title);
    });
    const filtered = filterList(realities);
    return respond(filtered);
  }

  if (category === 'shows') {
    const pool = [...(store.catalog.filme || []), ...(store.catalog.serie || [])];
    const music = pool.filter(item => (item.genres || []).some(g => normalizeText(g).includes('musica')));
    const filtered = filterList(music);
    return respond(filtered);
  }

  const list = store.catalog[category] || [];
  const filtered = filterList(list);
  return respond(filtered);
}

function extractYoutubeTrailerKey(tmdbDetails) {
  const videos = tmdbDetails?.videos?.results;
  if (!Array.isArray(videos) || !videos.length) return '';
  const yt = videos.filter(v => String(v.site || '').toLowerCase() === 'youtube' && v.key);
  if (!yt.length) return '';
  const scored = yt.map(v => {
    let score = 0;
    const type = String(v.type || '').toLowerCase();
    const lang = String(v.iso_639_1 || '').toLowerCase();
    if (type === 'trailer') score += 10;
    else if (type === 'teaser') score += 5;
    if (lang === 'pt') score += 6;
    if (v.official) score += 2;
    return { key: v.key, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.key || '';
}

function findSimilarCatalogItems(localItem, kind, genres = [], limit = 12) {
  const cat = CATEGORY_NORM[kind] || localItem?.kind || 'filme';
  const pool = store.catalog[cat] || [];
  if (!pool.length) return [];
  const currentId = String(localItem?.id || '');
  const targetGenres = new Set(
    (genres || []).map(g => normalizeText(typeof g === 'object' ? g.name : g)).filter(Boolean)
  );
  const scored = [];
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[i];
    if (!candidate || String(candidate.id) === currentId) continue;
    let overlap = 0;
    if (targetGenres.size && Array.isArray(candidate.genres)) {
      for (const cg of candidate.genres) {
        if (targetGenres.has(normalizeText(typeof cg === 'object' ? cg.name : cg))) overlap++;
      }
    }
    if (targetGenres.size && overlap === 0 && scored.length >= limit * 2) continue;
    const rating = Number(candidate.vote_average || candidate.rating || 0);
    const score = overlap * 15 + Math.min(10, rating);
    scored.push({ candidate, score });
    if (scored.length >= 280) break;
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ candidate }) => ({
    id: candidate.id,
    kind: candidate.kind || cat,
    title: candidate.title || candidate.name || '',
    poster: candidate.poster || candidate.poster_path || '',
    year: candidate.year || '',
    vote_average: candidate.vote_average || 0,
  }));
}

async function handleMovieDetails(response, movieId) {
  const localItem = store.byKindAndId.get(`filme:${movieId}`) || (store.byTmdb.get(`movie:${movieId}`) || [])[0] || null;
  let tmdbDetails = null;
  const tmdbId = localItem?.tmdb_id || '';
  if (tmdbId && (TMDB_API_KEY || TMDB_READ_TOKEN)) {
    try {
      tmdbDetails = await getTmdb(`/movie/${tmdbId}?language=pt-BR&append_to_response=credits,videos&include_video_language=pt,pt-BR,en,null`);
    } catch {}
  }
  if (!localItem && !tmdbDetails) {
    return sendJson(response, 404, { error: 'Filme não encontrado no catálogo.' });
  }
  const cast = (tmdbDetails?.credits?.cast || []).slice(0, 12).map(c => ({
    id: c.id,
    name: c.name,
    character: c.character || '',
    profile_path: c.profile_path || '',
  })).filter(c => c.name);
  const genres = tmdbDetails?.genres?.length ? tmdbDetails.genres : (localItem?.genres || []);
  const trailerKey = extractYoutubeTrailerKey(tmdbDetails);
  const similar = findSimilarCatalogItems(localItem || { id: movieId, kind: 'filme' }, 'filme', genres, 12);
  return sendJson(response, 200, {
    id: String(localItem?.id || movieId),
    details: {
      title: tmdbDetails?.title || localItem?.title || tmdbDetails?.original_title || '',
      overview: tmdbDetails?.overview || localItem?.overview || '',
      poster_path: tmdbDetails?.poster_path || localItem?.poster || '',
      backdrop_path: tmdbDetails?.backdrop_path || localItem?.backdrop || '',
      release_date: tmdbDetails?.release_date || localItem?.date || localItem?.year || '',
      vote_average: Number(tmdbDetails?.vote_average || localItem?.vote_average) || 0,
      runtime: Number(tmdbDetails?.runtime) || 0,
      genres,
      cast,
      trailerKey,
      similar,
    },
    routes: localItem?.routes || [],
  });
}

async function handleSeriesDetails(response, seriesId, requestedSeason, kindHint = 'serie') {
  const searchKinds = [kindHint];
  let localItem = null;
  for (const k of searchKinds) {
    localItem = store.byKindAndId.get(`${k}:${seriesId}`);
    if (localItem) break;
  }
  if (!localItem && /^\d+$/.test(seriesId)) {
    localItem = (store.byTmdb.get(`tv:${seriesId}`) || [])[0] || null;
  }

  const tmdbId = localItem?.tmdb_id || '';
  let tmdbDetails = null;
  if (tmdbId && (TMDB_API_KEY || TMDB_READ_TOKEN)) {
    try {
      tmdbDetails = await getTmdb(`/tv/${tmdbId}?language=pt-BR&append_to_response=credits,videos&include_video_language=pt,pt-BR,en,null`);
    } catch {}
  }

  let providerSeasonsMap = new Map();
  if (localItem) {
    try {
      providerSeasonsMap = await fetchBrazucaSeriesProviderData(localItem);
    } catch {}
  }

  const tmdbSeasons = (tmdbDetails?.seasons || [])
    .filter(s => Number(s.season_number) > 0 && Number(s.episode_count) > 0)
    .map(s => ({
      season_number: Number(s.season_number),
      name: s.name || `Temporada ${s.season_number}`,
      episode_count: Number(s.episode_count) || 0,
      air_date: s.air_date || '',
      poster_path: s.poster_path || '',
    }));

  let seasons = [];
  if (providerSeasonsMap.size > 0) {
    const sortedSeasonNums = [...providerSeasonsMap.keys()].sort((a, b) => a - b);
    seasons = sortedSeasonNums.map(sNum => {
      const tmdbS = tmdbSeasons.find(ts => ts.season_number === sNum);
      const epMap = providerSeasonsMap.get(sNum);
      return {
        season_number: sNum,
        name: tmdbS?.name || `Temporada ${sNum}`,
        episode_count: epMap.size,
        episode_numbers: [...epMap.keys()].sort((a,b) => a-b),
        air_date: tmdbS?.air_date || '',
        poster_path: tmdbS?.poster_path || '',
      };
    });
  } else {
    seasons = [];
  }

  const selectedSeasonObj = seasons.find(s => s.season_number === requestedSeason) || { season_number: requestedSeason, name: `Temporada ${requestedSeason}`, episode_count: 0 };
  const activeSeasonNum = selectedSeasonObj.season_number;

  let tmdbSeasonEpisodes = [];
  if (tmdbId && (TMDB_API_KEY || TMDB_READ_TOKEN)) {
    try {
      const sData = await getTmdb(`/tv/${tmdbId}/season/${activeSeasonNum}?language=pt-BR`);
      tmdbSeasonEpisodes = sData?.episodes || [];
    } catch {}
  }

  const providerEpMap = providerSeasonsMap.get(activeSeasonNum);
  let episodes = [];
  if (providerEpMap && providerEpMap.size > 0) {
    const sortedEps = [...providerEpMap.values()].sort((a, b) => a.episode_number - b.episode_number);
    episodes = sortedEps.map(pEp => {
      const tEp = tmdbSeasonEpisodes.find(e => Number(e.episode_number) === pEp.episode_number);
      return {
        episode_number: pEp.episode_number,
        name: tEp?.name || pEp.name || `Episódio ${pEp.episode_number}`,
        overview: tEp?.overview || '',
        air_date: tEp?.air_date || '',
        still_path: tEp?.still_path || localItem?.backdrop || localItem?.poster || '',
        vote_average: Number(tEp?.vote_average) || 0,
      };
    });
  } else {
    episodes = [];
  }

  const cast = (tmdbDetails?.credits?.cast || []).slice(0, 12).map(c => ({
    id: c.id,
    name: c.name,
    character: c.character || '',
    profile_path: c.profile_path || '',
  })).filter(c => c.name);

  const genres = tmdbDetails?.genres?.length ? tmdbDetails.genres : (localItem?.genres || []);
  const trailerKey = extractYoutubeTrailerKey(tmdbDetails);
  const similar = findSimilarCatalogItems(localItem || { id: seriesId, kind: kindHint }, localItem?.kind || kindHint, genres, 12);

  return sendJson(response, 200, {
    id: String(localItem?.id || seriesId),
    name: tmdbDetails?.name || localItem?.title || '',
    details: {
      title: tmdbDetails?.name || localItem?.title || tmdbDetails?.original_name || '',
      overview: tmdbDetails?.overview || localItem?.overview || '',
      poster_path: tmdbDetails?.poster_path || localItem?.poster || '',
      backdrop_path: tmdbDetails?.backdrop_path || localItem?.backdrop || '',
      first_air_date: tmdbDetails?.first_air_date || localItem?.date || localItem?.year || '',
      vote_average: Number(tmdbDetails?.vote_average || localItem?.vote_average) || 0,
      genres,
      status: tmdbDetails?.status || '',
      cast,
      trailerKey,
      similar,
    },
    seasons,
    season: activeSeasonNum,
    episodes,
    diagnostics:episodes.length ? [] : providerDiagnostics.get(`${localItem?.kind}:${localItem?.id}`) || [],
  });
}

async function handleResolvePlay(response, requestUrl) {
  const kind = CATEGORY_NORM[(requestUrl.searchParams.get('kind') || 'filme').toLowerCase()] || 'filme';
  const id = (requestUrl.searchParams.get('id') || '').trim();
  const season = Number(requestUrl.searchParams.get('season') || '1') || 1;
  const episode = Number(requestUrl.searchParams.get('episode') || '1') || 1;

  if (!id) return sendJson(response, 400, { error: 'Identificador do título ausente.' });

  const cacheKey = `${kind}:${id}:${kind === 'filme' || kind === 'canais' ? '0:0' : `${season}:${episode}`}`;
  const refresh = requestUrl.searchParams.get('refresh') === '1';
  const cachedPlay = refresh ? null : playResolutionCache.get(cacheKey);
  if (cachedPlay && cachedPlay.expiresAt > Date.now()) {
    return sendJson(response, 200, cachedPlay.payload);
  }

  if (kind === 'canais') {
    const channel = store.byKindAndId.get(`canais:${id}`);
    if (!channel) return sendJson(response, 404, { error: 'Canal não encontrado.' });
    const serversList = channel.servers || [];
    const settled = await Promise.allSettled(
      serversList.map(srv => withTimeout(resolveSingleRoutePlay(srv.route, 'Ao Vivo', refresh), 16000))
    );
    const options = [];
    for (let i = 0; i < settled.length; i++) {
      const res = settled[i];
      const srv = serversList[i];
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const opt of res.value) {
          const finalLabel = srv?.label || `Servidor ${i + 1}`;
          options.push({
            ...opt,
            label: finalLabel,
            server: finalLabel,
            region: srv?.region || '',
            quality: srv?.quality || '',
          });
        }
      }
    }
    if (!options.length) return sendJson(response, 502, { error: 'Nenhum servidor ativo respondeu para este canal.' });
    const payload = {
      id: channel.id,
      title: channel.name,
      category: channel.category || 'Canal ao Vivo',
      poster: channel.poster || '',
      options,
    };
    setPlayResolutionCache(cacheKey, payload, 300000);
    return sendJson(response, 200, payload);
  }

  let localItem = store.byKindAndId.get(`${kind}:${id}`);
  if (!localItem && /^\d+$/.test(id)) {
    const tmdbType = kind === 'filme' ? 'movie' : 'tv';
    localItem = (store.byTmdb.get(`${tmdbType}:${id}`) || [])[0] || null;
  }
  if (!localItem) return sendJson(response, 404, { error: 'Título não encontrado no catálogo.' });

  let routesToResolve = [];
  if (localItem.kind === 'filme') {
    routesToResolve = localItem.routes || [];
  } else {
    const seasonsMap = await fetchBrazucaSeriesProviderData(localItem, refresh);
    const epMap = seasonsMap.get(season);
    const epEntry = epMap?.get(episode);
    if (epEntry && epEntry.routes.length) {
      routesToResolve = epEntry.routes;
    }
  }

  if (!routesToResolve.length) {
    return sendJson(response, 502, { error: 'Nenhum episódio ou servidor disponível no provedor para este título.', diagnostics:providerDiagnostics.get(`${localItem.kind}:${localItem.id}`) || [] });
  }

  const options = [];
  const seenUrls = new Set();
  const diagnostics = [];
  const addOptions = (opts) => {
    if (Array.isArray(opts)) {
      for (const opt of opts) {
        if (opt?.url && !seenUrls.has(opt.url)) {
          seenUrls.add(opt.url);
          options.push(opt);
        }
      }
    }
  };

  const routePromises = routesToResolve.map(async r => {
    try {
      const res = await withTimeout(resolveSingleRoutePlay(r, 'Dublado', refresh), 16000);
      addOptions(res.map(option => ({...option,provider:r.split('=')[0]})));
      if (!res.length) diagnostics.push(providerDiagnostic(r));
      return res;
    } catch (error) {
      diagnostics.push(providerDiagnostic(r,error));
      return [];
    }
  });

  await Promise.allSettled(routePromises);

  // Prioritize Dublado first, then direct video/hls over iframe
  options.sort((a, b) => {
    const aDub = a.audio === 'Dublado' ? 0 : 1;
    const bDub = b.audio === 'Dublado' ? 0 : 1;
    if (aDub !== bDub) return aDub - bDub;
    const aType = a.kind === 'hls' ? 0 : (a.kind === 'video' ? 1 : 2);
    const bType = b.kind === 'hls' ? 0 : (b.kind === 'video' ? 1 : 2);
    return aType - bType;
  });

  // Group and label options cleanly as Servidor 1, Servidor 2, etc. per audio group
  const audioCounters = {};
  for (const opt of options) {
    const audioKey = opt.audio || 'Dublado';
    audioCounters[audioKey] = (audioCounters[audioKey] || 0) + 1;
    const num = audioCounters[audioKey];
    opt.server = `Servidor ${num}`;
    opt.label = `Servidor ${num}${opt.audio && opt.audio !== 'Ao Vivo' ? ` · ${opt.audio}` : ''}`;
  }

  if (!options.length) {
    return sendJson(response, 502, { error: 'Os provedores deste título não retornaram links compatíveis no momento.', diagnostics });
  }

  const payload = {
    id: localItem.id,
    title: localItem.title,
    kind: localItem.kind,
    season: localItem.kind === 'filme' ? 0 : season,
    episode: localItem.kind === 'filme' ? 0 : episode,
    options,
  };
  setPlayResolutionCache(cacheKey, payload, 1800000);
  return sendJson(response, 200, payload);
}


const loading = new Map();
const fresh = new Map();
async function ensureCatalog(kind) {
  const baseKinds = Object.keys(GIST_SOURCES);
  const kinds = [...(baseKinds.includes(kind) ? [kind] : kind === 'canais' ? [] : baseKinds), ...(kind === 'canais' || kind === 'pesquisa' || kind === 'all' ? ['canais'] : [])];
  for (const k of kinds) {
    if ((fresh.get(k) || 0) > Date.now()) continue;
    if (!loading.has(k)) loading.set(k, (async () => {
      try {
        if (k === 'canais') {
          const [xmlResult, plutoResult] = await Promise.allSettled([
            cachedTextFetch(CHANNELS_GIST_URL, {}, 900000),
            cachedTextFetch('https://api.pluto.tv/v2/channels.json', {}, 900000)
          ]);
          if (xmlResult.status === 'fulfilled') {
            const parsed = parseChannelsXml(xmlResult.value);
            store.iptvConfig = parsed.iptvConfig;
            store.channels = parsed.channels;
          }
          if (plutoResult.status === 'fulfilled') {
            for (const ch of JSON.parse(plutoResult.value)) {
              const channelUrl = `https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/v2/stitch/hls/channel/${ch._id}/master.m3u8`;
              store.channels.push({ id:`pluto-${ch._id}`, kind:'canais', name:ch.name, category:'Pluto TV', category_slug:'pluto-tv', subcategory:ch.category || '', poster:ch.colorLogoPNG?.path || '', servers:[{label:'Pluto TV', quality:'HD', route:`plutotv=${channelUrl}`}] });
            }
          }
          if (!store.channels.length) throw new Error('As origens de canais não responderam.');
        } else {
          const cfg = GIST_SOURCES[k];
          const text = await cachedTextFetch(cfg.url, {}, 900000);
          const items = parseCatalogXml(text, k, cfg.tag);
          // Parsed catalogs already have their own freshness window.
          // Avoid keeping the large source XML alongside normalized records.
          httpCache.delete(`GET:${cfg.url}:`);
          if (!items.length) throw new Error(`Catálogo ${k} indisponível.`);
          store.catalog[k] = items;
        }
        rebuildCatalogIndexes();
        store.source = 'cloudflare-live';
        store.updatedAt = new Date().toISOString();
        fresh.set(k, Date.now() + 900000);
      } finally { loading.delete(k); }
    })());
    try { await loading.get(k); } catch (error) {
      if (kinds.length === 1 && !(k === 'canais' ? store.channels.length : store.catalog[k]?.length)) throw error;
    }
  }
}
async function api(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/proxy') return media.handle(request);
  if (url.pathname === '/api/search') {
    url.pathname = '/api/lista';
    if (!url.searchParams.has('category')) url.searchParams.set('category','all');
    if (!url.searchParams.has('page')) url.searchParams.set('page','1');
  }
  if (/^\/(?:api\/)?(?:playlist|canais)\.m3u8?$/.test(url.pathname)) {
    await ensureCatalog('canais');
    const clean = value => String(value || '').replace(/[\r\n"]/g,' ');
    const lines = ['#EXTM3U'];
    for (const channel of store.channels) {
      lines.push(`#EXTINF:-1 tvg-id="${clean(channel.id)}" tvg-logo="${clean(channel.poster)}" group-title="${clean(channel.category)}",${clean(channel.name)}`,
        `${url.origin}/api/channel-stream/${encodeURIComponent(channel.id)}.m3u8`);
    }
    return new Response(lines.join('\n')+'\n',{headers:{'Content-Type':'application/vnd.apple.mpegurl; charset=utf-8','Cache-Control':'no-store'}});
  }
  if (url.pathname.startsWith('/api/channel-stream/')) {
    const id = decodeURIComponent(url.pathname.slice('/api/channel-stream/'.length).replace(/\.m3u8$/,''));
    await ensureCatalog('canais');
    const playUrl = new URL('/api/play',url);
    playUrl.searchParams.set('kind','canais');
    playUrl.searchParams.set('id',id);
    const result = {};
    await handleResolvePlay(result,playUrl);
    if (!result.result.ok) return result.result;
    const payload = await result.result.json();
    return Response.redirect(new URL(payload.options[0].url,url).href,307);
  }
  const response = {};
  if (url.pathname === '/api/lista') {
    await ensureCatalog(CATEGORY_NORM[url.searchParams.get('category')] || 'pesquisa');
    await handleCatalog(request, response, url);
  } else if (url.pathname === '/api/mapa') {
    await ensureCatalog('all');
    handleTextSitemapApi(response, url);
  } else if (url.pathname === '/api/play') {
    await ensureCatalog(CATEGORY_NORM[url.searchParams.get('kind')] || 'filme');
    await handleResolvePlay(response, url);
  } else if (url.pathname.startsWith('/api/movie/')) {
    await ensureCatalog('filme');
    await handleMovieDetails(response, decodeURIComponent(url.pathname.slice(11)));
  } else if (url.pathname.startsWith('/api/series/')) {
    const kind = CATEGORY_NORM[url.searchParams.get('kind')] || 'serie';
    await ensureCatalog(kind);
    await handleSeriesDetails(response, decodeURIComponent(url.pathname.slice(12)), Math.max(1, Number(url.searchParams.get('season')) || 1), kind);
  } else if (url.pathname === '/sitemap.xml') {
    await ensureCatalog('all');
    const escape = s => String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
    const paths = [...SITEMAP_ROUTES, ...[...store.byKindAndId.values()].filter((item,i,a) => a.indexOf(item) === i).map(item => `/assistir/${item.kind}/${encodeURIComponent(item.id)}`)];
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${escape(url.origin+p)}</loc></url>`).join('')}</urlset>`, { headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=900'} });
  }
  return response.result || new Response(JSON.stringify({ error:'Rota não encontrada.' }), {status:404,headers:{'Content-Type':'application/json'}});
}
return { api, ensureCatalog, parseCatalogXml, parseChannelsXml, store, handleCatalog, fetchBrazucaSeriesProviderData, resolveSingleRoutePlay };
}
