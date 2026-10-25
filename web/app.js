const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const ROUTES = {
  all: '/',
  filme: '/filmes',
  serie: '/series',
  anime: '/animes',
  dorama: '/doramas',
  desenho: '/desenhos',
  novela: '/novelas',
  documentarios: '/documentarios',
  programas: '/programas',
  shows: '/shows',
  canais: '/canais',
  favoritos: '/favoritos',
  historico: '/historico',
  mapa: '/mapa',
};
const PLATFORMS = [
  { slug: 'netflix', name: 'Netflix' },
  { slug: 'hbo-max', name: 'HBO Max' },
  { slug: 'prime-video', name: 'Prime Video' },
  { slug: 'disney-plus', name: 'Disney+' },
  { slug: 'apple-tv-plus', name: 'Apple TV+' },
  { slug: 'paramount-plus', name: 'Paramount+' },
  { slug: 'globoplay', name: 'Globoplay' },
  { slug: 'crunchyroll', name: 'Crunchyroll' },
];
const PLATFORM_TERMS = {
  'netflix': ['netflix'],
  'hbo max': ['hbo max', 'max'],
  'prime video': ['prime video', 'amazon prime video'],
  'disney+': ['disney+', 'disney plus'],
  'apple tv+': ['apple tv', 'apple tv+', 'apple tv plus'],
  'paramount+': ['paramount+', 'paramount plus'],
  'globoplay': ['globoplay'],
  'crunchyroll': ['crunchyroll'],
};
const LABELS = {
  all: 'Buscar',
  filme: 'Filmes',
  serie: 'Séries',
  anime: 'Animes',
  dorama: 'Doramas',
  desenho: 'Desenhos',
  novela: 'Novelas',
  documentarios: 'Documentários',
  programas: 'Programas de TV',
  shows: 'Shows e Música',
  canais: 'Canais de TV',
  favoritos: 'Minha Lista',
  historico: 'Histórico de Reprodução',
  mapa: 'Mapa do Site',
};
const CHANNEL_CATEGORIES = [
  { id: '', label: 'Todos' },
  { id: 'Canais Abertos', label: 'Canais Abertos' },
  { id: 'Esportes', label: 'Esportes' },
  { id: 'Filmes e Séries', label: 'Filmes e Séries' },
  { id: 'Documentários', label: 'Documentários' },
  { id: 'Infantil', label: 'Infantil' },
  { id: 'Variedades', label: 'Variedades' },
  { id: 'Notícias', label: 'Notícias' },
  { id: 'Reality Shows', label: 'Reality Shows' },
  { id: 'Pluto TV', label: 'Pluto TV' },
];
const HISTORY_CATEGORIES = [
  { id: '', label: 'Todos' },
  { id: 'filme', label: 'Filmes' },
  { id: 'serie', label: 'Séries' },
  { id: 'anime', label: 'Animes' },
  { id: 'dorama', label: 'Doramas' },
  { id: 'desenho', label: 'Desenhos' },
  { id: 'novela', label: 'Novelas' },
];
const FAVORITES_CATEGORIES = [
  { id: '', label: 'Todos' },
  { id: 'filme', label: 'Filmes' },
  { id: 'serie', label: 'Séries' },
  { id: 'anime', label: 'Animes' },
  { id: 'dorama', label: 'Doramas' },
  { id: 'desenho', label: 'Desenhos' },
  { id: 'novela', label: 'Novelas' },
  { id: 'canais', label: 'Canais de TV' },
];
const CATALOG_GENRES = [
  { id: '', label: 'Todos' },
  { id: 'cinema', label: 'Cinema 🎬' },
  { id: 'acao', label: 'Ação' },
  { id: 'aventura', label: 'Aventura' },
  { id: 'animacao', label: 'Animação' },
  { id: 'comedia', label: 'Comédia' },
  { id: 'crime', label: 'Crime' },
  { id: 'documentario', label: 'Documentário' },
  { id: 'drama', label: 'Drama' },
  { id: 'familia', label: 'Família' },
  { id: 'fantasia', label: 'Fantasia' },
  { id: 'ficcao', label: 'Ficção científica' },
  { id: 'guerra', label: 'Guerra' },
  { id: 'misterio', label: 'Mistério' },
  { id: 'romance', label: 'Romance' },
  { id: 'suspense', label: 'Suspense' },
  { id: 'terror', label: 'Terror' },
];
const MEDIA_KINDS = new Set(['filme', 'serie', 'anime', 'dorama', 'desenho', 'novela', 'documentarios', 'programas', 'shows']);
const EPISODIC_KINDS = new Set(['serie', 'anime', 'dorama', 'desenho', 'novela', 'programas']);
const API_CATEGORIES = {
  filme: 'filme',
  serie: 'serie',
  anime: 'anime',
  dorama: 'dorama',
  desenho: 'desenho',
  novela: 'novela',
  documentarios: 'documentarios',
  programas: 'programas',
  shows: 'shows',
  canais: 'canais',
};

const KIND_SINGULAR = {
  filmes: 'filme',
  series: 'serie',
  animes: 'anime',
  doramas: 'dorama',
  novelas: 'novela',
  desenhos: 'desenho',
};
const KIND_PLURALS = {
  filme: 'filmes',
  serie: 'series',
  anime: 'animes',
  dorama: 'doramas',
  novela: 'novelas',
  desenho: 'desenhos',
};

const initialPath = window.location.pathname.replace(/\/$/, '') || '/';
const watchRouteMatch = initialPath.match(/^\/assistir\/(filme|serie|anime|dorama|desenho|novela|canais)\/([^/]+)(?:\/(\d+)\/(\d+))?$/);
const platformCategoryMatch = initialPath.match(/^\/plataforma\/([a-z0-9-]+)\/(filmes|series|animes|doramas|novelas|desenhos)$/);
const platformCatSlug = platformCategoryMatch?.[1] || '';
const platformCatKindRaw = platformCategoryMatch?.[2] || '';
const initialPlatformCat = PLATFORMS.find(platform => platform.slug === platformCatSlug) || null;
const platformSlug = initialPath.match(/^\/plataforma\/([a-z0-9-]+)$/)?.[1] || '';
const initialPlatform = PLATFORMS.find(platform => platform.slug === platformSlug) || null;
const isPlatformCat = Boolean(platformCategoryMatch && initialPlatformCat);
const initialPlatformObj = isPlatformCat ? initialPlatformCat : initialPlatform;
const initialKind = watchRouteMatch
  ? 'watch'
  : isPlatformCat
    ? 'platform_category'
    : initialPlatform
      ? 'platform'
      : Object.entries(ROUTES).find(([, path]) => path === initialPath)?.[0] || 'all';
const initialSearchQuery = initialPath === '/' ? new URLSearchParams(window.location.search).get('q')?.trim() || '' : '';
const initialActorQuery = initialPath === '/' ? new URLSearchParams(window.location.search).get('ator')?.trim() || new URLSearchParams(window.location.search).get('actor')?.trim() || '' : '';

const state = {
  kind: initialKind,
  items: [],
  searchItems: null,
  searchActorInfo: null,
  query: '',
  channelCategory: '',
  channelFilter: '',
  genre: CATALOG_GENRES.some(genre => genre.id === new URLSearchParams(window.location.search).get('genero'))
    ? new URLSearchParams(window.location.search).get('genero') : '',
  categoryYear: '',
  categorySort: '',
  historyCategory: '',
  favoritesCategory: '',
  platform: initialPlatformObj?.name || '',
  platformSlug: initialPlatformObj?.slug || '',
  platformCategoryKind: isPlatformCat ? (KIND_SINGULAR[platformCatKindRaw] || 'filme') : '',
  sort: 'recent',
  limit: 50,
  page: 1,
  total: 0,
  canLoadMore: false,
  searchFilters: null,
  platformSections: Object.fromEntries(['filme', 'serie', 'anime', 'dorama', 'novela'].map(kind => [kind, { items: [], page: 1, total: null, canLoadMore: false, requestId: 0 }])),
  selected: null,
  playback: null,
  episodeData: null,
  episodeFilter: '',
  watchEpisodeFilter: '',
  episodeRequestId: 0,
  user: null,
  history: [],
  favorites: [],
  theaterMode: false,
  autoNextEpisode: false,
  autoNextSeriesKey: '',
  authMode: 'login',
  mapa: {
    kind: 'all',
    sort: 'az',
    letter: '',
    year: '',
    query: '',
    page: 1,
    limit: 500,
    total: 0,
    hasMore: false,
    items: [],
    counts: {},
    years: [],
    loading: false,
  },
  watch: watchRouteMatch ? {
    kind: watchRouteMatch[1],
    id: decodeURIComponent(watchRouteMatch[2]),
    season: Number(watchRouteMatch[3]) || 1,
    episode: Number(watchRouteMatch[4]) || 1,
    explicitRouteEpisode: Boolean(watchRouteMatch[3] && watchRouteMatch[4]),
    data: null,
    loading: false,
    options: [],
    activeOptionIndex: 0,
    playRequestId: 0,
    channels: [],
    channelCategory: '',
    channelFilter: '',
  } : null,
  requestId: 0,
};

const $ = selector => document.querySelector(selector);
const grid = $('#discovery-row');
const palette = ['#e6dddd', '#d8e1e2', '#e4e1d7', '#ddd9e8', '#dbe2d6', '#e7dad0'];
let activeWatchHls = null;
let activeModalHls = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function formatDuration(seconds = 0) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  if (!s) return '0:00';
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
function formatRelativeDate(isoStr) {
  if (!isoStr) return '';
  const dt = new Date(isoStr);
  if (Number.isNaN(dt.getTime())) return '';
  const diffMin = Math.floor((Date.now() - dt.getTime()) / 60000);
  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(dt);
}
function titleOf(item) {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  const title = item?.title || item?.name || item?.channel_name || item?.channel || item?.episode_title || item?.series_name || item?.original_title || item?.original_name || item?.nome || item?.titulo || item?.label;
  if (title) return title;
  return item?.id || item?.itemId || item?.tmdb || item?.slug || 'Título do catálogo';
}
function idOf(item) {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  return String(item?.itemId || item?.id || item?.tmdb_id || item?.tmdb || item?.id_tmdb || item?.imdb_id || item?.imdb || item?.channel_id || item?.slug || item?.name || '');
}
function kindOf(item, fallback = 'filme') {
  const raw = String(item?.kind || item?.type || item?.category || item?.content_type || item?.media_type || item?.tipo || '').toLocaleLowerCase('pt-BR');
  if (raw.includes('channel') || raw.includes('canal') || raw === 'canais' || item?.channel_id || item?.channel_logo || item?.play_channel_url) return 'canais';
  if (raw.includes('novela')) return 'novela';
  if (raw.includes('desenho')) return 'desenho';
  if (raw.includes('anime')) return 'anime';
  if (raw.includes('dorama')) return 'dorama';
  if (raw.includes('series') || raw.includes('série') || raw.includes('serie') || raw === 'tv') return 'serie';
  if (raw.includes('movie') || raw.includes('filme')) return 'filme';
  return fallback;
}
function imageOf(item) {
  const tmdbPath = item?.poster_path || item?.backdrop_path;
  const path = tmdbPath || item?.poster || item?.backdrop || item?.image || item?.cover || item?.logo || item?.logo_url || item?.channel_logo || item?.channel_image || item?.thumbnail || item?.thumbnail_url;
  if (!path) return '';
  if (path.startsWith('//')) return `https:${path}`;
  if (/^https?:\/\//i.test(path)) return path;
  if (!tmdbPath && item?.api_base) {
    try { return new URL(path, item.api_base).href; } catch { return ''; }
  }
  return `${IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
function yearOf(item) {
  return String(item?.year || item?.release_date?.slice?.(0, 4) || item?.first_air_date?.slice?.(0, 4) || item?.date?.slice?.(0, 4) || item?.air_date?.slice?.(0, 4) || '');
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
function displayDateOf(item) {
  const s = String(item?.date || item?.release_date || item?.first_air_date || '').trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return `${m2[3]}/${m2[2]}/${m2[1]}`;
  return yearOf(item);
}
function platformsOf(item) {
  const raw = item?.platforms || item?.providers || item?.watch_providers || item?.streaming || item?.platform || item?.network || [];
  return (Array.isArray(raw) ? raw : [raw]).map(value => typeof value === 'string' ? value : value?.provider_name || value?.name || '').filter(Boolean);
}
function normalize(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of ['results', 'data', 'items', 'lista', 'catalog', 'movies', 'series', 'channels', 'genres', 'categories', 'channels_list']) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return Object.entries(payload)
    .filter(([key]) => !['status', 'message', 'error', 'categories'].includes(key))
    .map(([id, value]) => typeof value === 'object' && value ? ({ id, ...value }) : ({ id, title: value }));
}
async function requestJson(url, options = {}) {
  let response;
  try {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor do DEEPFLIX. Verifique sua conexão e tente novamente.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `A API respondeu com status ${response.status}.`);
  return payload;
}

// --- Auth, Hybrid History & Hybrid Favorites State Management ---
const LOCAL_HISTORY_KEY = 'deepflix_local_history_v1';
const LOCAL_FAVORITES_KEY = 'deepflix_local_favorites_v1';

function loadLocalHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(h => h && h.key && h.kind !== 'canais') : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(list) {
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify((list || []).slice(0, 300)));
  } catch {}
}

function loadLocalFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_FAVORITES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(f => f && f.key) : [];
  } catch {
    return [];
  }
}

function saveLocalFavorites(list) {
  try {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify((list || []).slice(0, 500)));
  } catch {}
}

function mergeByKey(primaryList = [], secondaryList = []) {
  const map = new Map();
  for (const item of [...primaryList, ...secondaryList]) {
    if (!item || !item.key) continue;
    const existing = map.get(item.key);
    if (!existing || String(item.updatedAt || '') > String(existing.updatedAt || '')) {
      map.set(item.key, item);
    }
  }
  return [...map.values()].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

function findHistoryEntry(kind, id) {
  const key = `${kind}:${id}`;
  return state.history.find(h => h.key === key) || null;
}

function isFavorite(kind, id) {
  const key = `${kind}:${id}`;
  return state.favorites.some(f => f.key === key);
}

function renderAuthUI() {
  const user = state.user;
  const countBadge = $('#sidebar-history-count');
  const favBadge = $('#sidebar-favorites-count');
  const sidebarLabel = $('#sidebar-account-label');
  const sidebarStatus = $('#sidebar-status-text');
  const topbarBtn = $('#topbar-auth-btn');
  const watchUserBox = $('#watch-topbar-user');
  const mobileAccountLabel = $('#mobile-bottom-account-label');
  const mobileAccountBtn = $('#mobile-bottom-account-btn');

  if (countBadge) {
    countBadge.hidden = !state.history.length;
    countBadge.textContent = String(state.history.length);
  }
  if (favBadge) {
    favBadge.hidden = !state.favorites.length;
    favBadge.textContent = String(state.favorites.length);
  }
  const mobFavBadge = $('#mobile-favorites-count');
  if (mobFavBadge) {
    mobFavBadge.hidden = !state.favorites.length;
    mobFavBadge.textContent = String(state.favorites.length);
  }
  if (sidebarLabel) {
    sidebarLabel.textContent = user ? user.name : 'Entrar / Criar conta';
  }
  if (mobileAccountLabel) {
    mobileAccountLabel.textContent = user ? (user.name || user.username || 'Conta').split(' ')[0] : 'Conta';
  }
  if (mobileAccountBtn) {
    mobileAccountBtn.classList.toggle('logged-in', Boolean(user));
  }
  if (sidebarStatus) {
    sidebarStatus.textContent = user ? `Conectado como ${user.name}` : 'Salvo neste aparelho · Entre para sincronizar';
  }
  if (topbarBtn) {
    if (user) {
      const initial = (user.name || user.username || 'U').slice(0, 1).toUpperCase();
      topbarBtn.classList.add('logged-in');
      topbarBtn.innerHTML = `<span class="auth-mini-avatar">${escapeHtml(initial)}</span><span>${escapeHtml(user.name)}</span>`;
    } else {
      topbarBtn.classList.remove('logged-in');
      topbarBtn.textContent = 'Entrar / Criar conta';
    }
  }
  if (watchUserBox) {
    if (user) {
      const initial = (user.name || user.username || 'U').slice(0, 1).toUpperCase();
      watchUserBox.innerHTML = `<button class="auth-trigger-btn logged-in" id="watch-auth-btn" type="button"><span class="auth-mini-avatar">${escapeHtml(initial)}</span><span>${escapeHtml(user.name)}</span></button>`;
    } else {
      watchUserBox.innerHTML = `<button class="auth-trigger-btn" id="watch-auth-btn" type="button">Sincronizar conta</button>`;
    }
    $('#watch-auth-btn')?.addEventListener('click', () => openAuthModal());
  }

  // Update Auth Modal views
  const guestView = $('#auth-guest-view');
  const userView = $('#auth-user-view');
  if (guestView && userView) {
    guestView.hidden = Boolean(user);
    userView.hidden = !user;
    if (user) {
      $('#auth-profile-avatar').textContent = (user.name || user.username || 'U').slice(0, 1).toUpperCase();
      $('#auth-profile-name').textContent = user.name;
      $('#auth-profile-username').textContent = `@${user.username}`;
      $('#auth-profile-stats').textContent = `${state.history.length} ${state.history.length === 1 ? 'item' : 'itens'} no histórico · ${state.favorites.length} na Minha Lista`;
    }
  }
  renderContinueWatchingSection();
}

function setAuthTab(mode) {
  state.authMode = mode === 'register' ? 'register' : 'login';
  const isReg = state.authMode === 'register';
  $('#auth-tab-login')?.classList.toggle('active', !isReg);
  $('#auth-tab-login')?.setAttribute('aria-selected', String(!isReg));
  $('#auth-tab-register')?.classList.toggle('active', isReg);
  $('#auth-tab-register')?.setAttribute('aria-selected', String(isReg));
  const nameWrap = $('#auth-name-wrap');
  if (nameWrap) nameWrap.hidden = !isReg;
  const submitBtn = $('#auth-submit-btn');
  if (submitBtn) submitBtn.textContent = isReg ? 'Criar minha conta' : 'Entrar na conta';
  const errEl = $('#auth-error');
  if (errEl) errEl.hidden = true;
}

function openAuthModal(defaultMode = 'login') {
  if (!state.user) setAuthTab(defaultMode);
  renderAuthUI();
  const dlg = $('#auth-dialog');
  if (dlg && !dlg.open) dlg.showModal();
}

async function initAuthAndHistory() {
  const localHist = loadLocalHistory();
  const localFavs = loadLocalFavorites();
  state.history = localHist;
  state.favorites = localFavs;
  try {
    const me = await requestJson('/api/auth/me');
    state.user = me.user || null;
    if (state.user) {
      const [histRes, favRes] = await Promise.all([
        requestJson('/api/history?limit=250').catch(() => ({ results: [] })),
        requestJson('/api/favorites').catch(() => ({ results: [] })),
      ]);
      const cloudHist = (Array.isArray(histRes.results) ? histRes.results : []).filter(h => h.kind !== 'canais');
      const cloudFavs = Array.isArray(favRes.results) ? favRes.results : [];
      state.history = mergeByKey(cloudHist, localHist);
      state.favorites = mergeByKey(cloudFavs, localFavs);
      saveLocalHistory(state.history);
      saveLocalFavorites(state.favorites);
    }
  } catch {
    state.user = null;
  }
  renderAuthUI();
  if (state.kind === 'historico' || state.kind === 'favoritos') render();
}

async function recordWatchProgress(payload) {
  if (!payload?.itemId || payload.kind === 'canais') return;
  const key = `${payload.kind}:${payload.itemId}`;
  const prev = state.history.find(h => h.key === key) || {};
  const entry = {
    ...prev,
    ...payload,
    key,
    updatedAt: new Date().toISOString(),
  };
  const idx = state.history.findIndex(h => h.key === key);
  if (idx >= 0) state.history.splice(idx, 1);
  state.history.unshift(entry);
  saveLocalHistory(state.history);
  renderAuthUI();
  if (state.user) {
    try {
      const res = await requestJson('/api/history', {
        method: 'POST',
        body: payload,
      });
      if (res.item) {
        const cIdx = state.history.findIndex(h => h.key === res.item.key);
        if (cIdx >= 0) state.history[cIdx] = res.item;
        saveLocalHistory(state.history);
      }
    } catch {}
  }
}

async function removeHistoryItem(key) {
  if (!key) return;
  state.history = state.history.filter(h => h.key !== key);
  saveLocalHistory(state.history);
  renderAuthUI();
  if (state.kind === 'historico') render();
  showToast('Item removido do histórico.');
  if (state.user) {
    try {
      await requestJson(`/api/history?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch {}
  }
}

async function clearAllHistory() {
  state.history = [];
  saveLocalHistory([]);
  renderAuthUI();
  if (state.kind === 'historico') render();
  showToast('Todo o histórico foi limpo.');
  if (state.user) {
    try {
      await requestJson('/api/history', { method: 'DELETE' });
    } catch {}
  }
}

async function toggleFavoriteItem(item, kindHint = 'filme') {
  const kind = kindHint || item?.__kind || item?.kind || 'filme';
  const itemId = String(idOf(item) || '').trim();
  if (!itemId) return;
  const key = `${kind}:${itemId}`;
  const existingIdx = state.favorites.findIndex(f => f.key === key);
  if (existingIdx >= 0) {
    state.favorites.splice(existingIdx, 1);
    saveLocalFavorites(state.favorites);
    renderAuthUI();
    syncFavoriteButtonsState();
    if (state.kind === 'favoritos' || state.kind === 'canais') render();
    if (state.watch?.kind === 'canais') renderWatchChannelsDirectory();
    showToast('Removido da Minha Lista.');
    if (state.user) {
      requestJson(`/api/favorites?key=${encodeURIComponent(key)}`, { method: 'DELETE' }).catch(() => {});
    }
    return false;
  }
  const entry = {
    key,
    kind,
    itemId,
    title: titleOf(item),
    poster: imageOf(item) || item?.poster || item?.poster_path || '',
    backdrop: item?.backdrop || item?.backdrop_path || '',
    year: yearOf(item),
    category: item?.category || item?.category_name || '',
    vote_average: Number(item?.vote_average || item?.rating || 0) || 0,
    updatedAt: new Date().toISOString(),
  };
  state.favorites.unshift(entry);
  saveLocalFavorites(state.favorites);
  renderAuthUI();
  syncFavoriteButtonsState();
  if (state.kind === 'favoritos' || state.kind === 'canais') render();
  if (state.watch?.kind === 'canais') renderWatchChannelsDirectory();
  showToast(kind === 'canais' ? '★ Canal adicionado aos Favoritos!' : '★ Adicionado à Minha Lista!');
  if (state.user) {
    requestJson('/api/favorites', { method: 'POST', body: entry }).catch(() => {});
  }
  return true;
}

async function clearAllFavorites() {
  state.favorites = [];
  saveLocalFavorites([]);
  renderAuthUI();
  syncFavoriteButtonsState();
  if (state.kind === 'favoritos' || state.kind === 'canais') render();
  showToast('Minha Lista foi limpa.');
  if (state.user) {
    requestJson('/api/favorites', { method: 'DELETE' }).catch(() => {});
  }
}

function syncFavoriteButtonsState() {
  document.querySelectorAll('[data-fav-toggle]').forEach(btn => {
    const [k, id] = (btn.dataset.favToggle || '').split(':');
    const fav = isFavorite(k, id);
    btn.classList.toggle('active', fav);
    btn.innerHTML = fav ? '★' : '☆';
    btn.title = fav ? 'Remover da Minha Lista' : 'Salvar na Minha Lista';
  });
  if (state.selected) {
    const fav = isFavorite(state.selected.kind, idOf(state.selected.item));
    const btn = $('#detail-fav-btn');
    if (btn) {
      btn.classList.toggle('active', fav);
      btn.innerHTML = fav ? '★ Na Minha Lista' : '☆ Minha Lista';
    }
  }
  if (state.watch) {
    const fav = isFavorite(state.watch.kind, state.watch.id);
    const btn = $('#watch-fav-btn');
    if (btn) {
      btn.classList.toggle('active', fav);
      btn.innerHTML = fav ? '★ Na Minha Lista' : '☆ Minha Lista';
    }
    const chBtn = $('#watch-channel-fav-btn');
    if (chBtn && state.watch.kind === 'canais') {
      chBtn.classList.toggle('active', fav);
      chBtn.innerHTML = fav ? '★ Canal Favorito' : '☆ Favoritar Canal';
    }
  }
}

function renderContinueWatchingSection() {
  const section = $('#continue-watching-section');
  const row = $('#continue-watching-row');
  if (!section || !row) return;
  const shouldShow = state.history.length > 0 && state.kind === 'all' && !state.searchFilters;
  section.hidden = !shouldShow;
  if (!shouldShow) return;
  const recent = state.history.slice(0, 6);
  row.innerHTML = recent.map((entry, idx) => card({ ...entry, id: entry.itemId, __kind: entry.kind, __isHistoryCard: true }, idx)).join('');
}

async function getCatalog(category, options = {}) {
  if (window.location.protocol === 'file:') {
    throw new Error('Abra o site pelo servidor local. No Windows, execute iniciar-site.bat e use o endereço exibido.');
  }
  const params = new URLSearchParams({
    category,
    format: 'json',
    limit: String(options.limit || 50),
    order: options.order || 'desc',
  });
  if (MEDIA_KINDS.has(category)) params.set('type', options.type || 'tmdb');
  if (options.genre) params.set(MEDIA_KINDS.has(category) ? 'genero' : 'genre', options.genre);
  if (options.query) params.set('q', options.query);
  if (options.actor) params.set('actor', options.actor);
  if (options.year) params.set('year', options.year);
  if (options.platform) params.set('platform', options.platform);
  if (options.kind) params.set('kind', options.kind);
  if (options.page) params.set('page', options.page);
  if (options.sort) params.set('sort', options.sort);
  const payload = await requestJson(`/api/lista?${params}`);
  if (options.page) return { items: normalize(payload), total: payload.total, hasMore: Boolean(payload.hasMore), actor: payload.actor || null };
  return normalize(payload);
}
function paginationMarkup(page, total, hasMore, section = '', pageSize = 50) {
  const pages = total == null ? page + (hasMore ? 1 : 0) : Math.ceil(total / pageSize);
  if (pages < 2) return '';
  const chosen = new Set([1, pages, ...Array.from({length: 5}, (_, i) => page - 2 + i).filter(n => n > 0 && n <= pages)]);
  const sorted = [...chosen].sort((a, b) => a - b);
  const attr = section === 'mapa' ? 'data-page-mapa' : section ? `data-page-section="${section}"` : 'data-page-main';
  let previous = 0;
  return sorted.map(n => { const dots = n - previous > 1 ? '<span aria-hidden="true">…</span>' : ''; previous = n; return `${dots}<button class="page-button${n === page ? ' active' : ''}" type="button" ${attr} data-page="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`; }).join('');
}
function normalizeItem(item, kind) {
  return typeof item === 'string' || typeof item === 'number'
    ? { id: String(item), title: String(item), __kind: kind }
    : { ...item, __kind: kindOf(item, kind) };
}
function displayItems() {
  if (state.kind === 'historico') {
    return state.history
      .filter(h => h.kind !== 'canais' && (!state.historyCategory || h.kind === state.historyCategory))
      .map(h => ({ ...h, id: h.itemId, __kind: h.kind, __isHistoryCard: true }));
  }
  if (state.kind === 'favoritos') {
    return state.favorites
      .filter(f => !state.favoritesCategory || f.kind === state.favoritesCategory)
      .map(f => ({ ...f, id: f.itemId, __kind: f.kind, __isFavoriteCard: true }));
  }
  if (state.searchItems) return state.searchItems;
  if (state.kind === 'platform') return Object.values(state.platformSections).flatMap(section => section.items);
  if (state.kind === 'platform_category') return state.items.map(item => normalizeItem(item, state.platformCategoryKind));
  return state.items.map(item => normalizeItem(item, ['all', 'platform'].includes(state.kind) ? (item?.__kind || kindOf(item)) : state.kind));
}
function card(item, index) {
  const kind = item.__kind || item.kind || (state.kind === 'platform_category' ? state.platformCategoryKind : state.kind);
  const title = titleOf(item), id = idOf(item), image = imageOf(item);
  const year = yearOf(item), rating = item?.vote_average || item?.rating || item?.nota || '';
  const displayDate = displayDateOf(item);
  const histEntry = item.__isHistoryCard ? item : findHistoryEntry(kind, id);
  const isHistoryView = Boolean(item.__isHistoryCard);
  const fav = isFavorite(kind, id);

  let subtitle = kind === 'canais'
    ? item?.category_name || item?.category || item?.genre || 'Canal de TV'
    : displayDate || year || item?.genre || 'Catálogo DEEPFLIX';

  if (histEntry && EPISODIC_KINDS.has(kind) && histEntry.season && histEntry.episode) {
    subtitle = `T${histEntry.season}:E${histEntry.episode}${histEntry.updatedAt ? ` · ${formatRelativeDate(histEntry.updatedAt)}` : ''}`;
  } else if (histEntry && histEntry.updatedAt && isHistoryView) {
    subtitle = `${histEntry.serverLabel || displayDate || year || 'Assistido'} · ${formatRelativeDate(histEntry.updatedAt)}`;
  }

  let progressHtml = '';
  let resumeTagHtml = '';
  if (histEntry) {
    const pct = histEntry.duration > 0 && histEntry.currentTime > 0
      ? Math.min(98, Math.max(4, Math.round((histEntry.currentTime / histEntry.duration) * 100)))
      : 0;
    if (pct > 0) {
      progressHtml = `<span class="card-progress-bar"><span class="card-progress-fill" style="width:${pct}%"></span></span>`;
    }
    if (isHistoryView) {
      let tagText = '';
      if (EPISODIC_KINDS.has(kind) && histEntry.season && histEntry.episode) {
        tagText = `Continuar T${histEntry.season}:E${histEntry.episode}`;
        if (histEntry.currentTime > 15) tagText += ` (${formatDuration(histEntry.currentTime)})`;
      } else if (histEntry.currentTime > 15) {
        tagText = `Continuar em ${formatDuration(histEntry.currentTime)}`;
      } else if (kind === 'canais') {
        tagText = histEntry.serverLabel || 'Assistir ao vivo';
      }
      if (tagText) resumeTagHtml = `<span class="card-resume-tag">${escapeHtml(tagText)}</span>`;
    }
  }

  const poster = image
    ? `<img loading="lazy" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" onerror="this.remove()">`
    : `<span class="card-gradient" style="--poster-tone:${palette[index % palette.length]}"><span class="poster-initial">${escapeHtml(title.slice(0, 1).toUpperCase())}</span></span>`;
  const badge = {
    filme: 'FILME',
    serie: 'SÉRIE',
    anime: 'ANIME',
    dorama: 'DORAMA',
    desenho: 'DESENHO',
    novela: 'NOVELA',
    canais: 'AO VIVO',
  }[kind] || 'TÍTULO';
  const numericRating = Number(rating);
  const formattedRating = numericRating > 0 ? `★ ${numericRating.toFixed(1)}` : '';
  const seasonAttr = histEntry?.season ? ` data-season="${Number(histEntry.season)}"` : '';
  const epAttr = histEntry?.episode ? ` data-episode="${Number(histEntry.episode)}"` : '';
  const removeBtn = isHistoryView && histEntry?.key
    ? `<button class="card-remove-btn" type="button" data-remove-history="${escapeHtml(histEntry.key)}" title="Remover do histórico" aria-label="Remover ${escapeHtml(title)} do histórico">×</button>`
    : '';
  const favBtn = `<button class="card-fav-btn${fav ? ' active' : ''}" type="button" data-fav-toggle="${escapeHtml(kind)}:${escapeHtml(id)}" data-fav-kind="${escapeHtml(kind)}" data-fav-id="${escapeHtml(id)}" title="${fav ? 'Remover da Minha Lista' : 'Salvar na Minha Lista'}" aria-label="${fav ? 'Remover da Minha Lista' : 'Salvar na Minha Lista'}">${fav ? '★' : '☆'}</button>`;
  const cardActions = `<div class="card-top-actions">${favBtn}${removeBtn}</div>`;

  const rawOverview = item?.overview || item?.sinopse || item?.description || '';
  const cleanOverview = rawOverview.length > 130 ? `${rawOverview.slice(0, 127).trim()}…` : rawOverview;
  const genresList = Array.isArray(item?.genres) ? item.genres.slice(0, 2).join(' · ') : (item?.genre || '');
  const previewOverlayHtml = (cleanOverview || genresList) && kind !== 'canais'
    ? `<span class="card-preview-overlay" aria-hidden="true">${genresList ? `<span class="preview-genres">${escapeHtml(genresList)}</span>` : ''}${cleanOverview ? `<span class="preview-overview">${escapeHtml(cleanOverview)}</span>` : ''}<span class="preview-action-row"><span class="preview-watch-btn">▶ Assistir</span></span></span>`
    : '';

  return `<div class="card-wrap">${cardActions}<button class="movie-card" type="button" data-id="${escapeHtml(id)}" data-kind="${escapeHtml(kind)}"${seasonAttr}${epAttr} aria-label="Assistir ${escapeHtml(title)}">
    <span class="card-poster">${poster}<span class="card-badge">${badge}</span>${resumeTagHtml}${progressHtml}${previewOverlayHtml}<span class="card-play" aria-hidden="true">▶</span></span>
    <span class="card-info"><span class="card-title">${escapeHtml(title)}</span><span class="card-meta"><span>${escapeHtml(String(subtitle || ''))}</span><span class="card-rating">${escapeHtml(formattedRating)}</span></span></span>
  </button></div>`;
}
function sortItems(items) {
  const sorted = [...items];
  if (state.sort === 'az') sorted.sort((a, b) => titleOf(a).localeCompare(titleOf(b), 'pt-BR'));
  if (state.sort === 'rating') sorted.sort((a, b) => Number(b?.vote_average || b?.rating || 0) - Number(a?.vote_average || a?.rating || 0));
  if (state.sort === 'recent') sorted.sort((a, b) => {
    const diff = getSortableReleaseDate(b).localeCompare(getSortableReleaseDate(a));
    if (diff !== 0) return diff;
    return titleOf(a).localeCompare(titleOf(b), 'pt-BR');
  });
  if (state.sort === 'popular') sorted.sort((a, b) => Number(b?.popularity || b?.vote_average || 0) - Number(a?.popularity || a?.vote_average || 0));
  return sorted;
}
function normalizeSearchStr(val = '') {
  return String(val || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function buildChannelRowHtml(ch, activeChannelId = '') {
  const id = idOf(ch);
  const isCurrent = activeChannelId && (id === activeChannelId || (Array.isArray(ch.aliases) && ch.aliases.includes(activeChannelId)));
  const fav = isFavorite('canais', id);
  const title = titleOf(ch);
  const category = ch.category || '';
  return `<li class="channel-text-item${isCurrent ? ' active' : ''}">
    <a class="channel-text-link" href="/assistir/canais/${encodeURIComponent(id)}" data-channel-switch="${escapeHtml(id)}">
      <span class="channel-live-dot" aria-hidden="true"></span>
      <span class="channel-text-name">${escapeHtml(title)}</span>
    </a>
    <button class="channel-fav-star${fav ? ' active' : ''}" type="button" data-fav-channel="${escapeHtml(id)}" data-fav-title="${escapeHtml(title)}" data-fav-category="${escapeHtml(category)}" title="${fav ? 'Remover dos canais favoritos' : 'Salvar nos canais favoritos'}" aria-label="${fav ? 'Remover dos canais favoritos' : 'Salvar nos canais favoritos'}">${fav ? '★' : '☆'}</button>
  </li>`;
}

function buildChannelsDirectoryHtml(channels = [], activeChannelId = '', filterText = '', categoryFilter = '') {
  const normFilter = normalizeSearchStr(filterText);
  const filtered = channels.filter(ch => {
    if (categoryFilter && ch.category !== categoryFilter) return false;
    if (normFilter && !normalizeSearchStr(`${ch.name} ${ch.category || ''}`).includes(normFilter)) return false;
    return true;
  });
  if (!filtered.length) {
    return '<div class="empty-state">Nenhum canal encontrado com esse filtro.</div>';
  }

  const favChannels = filtered.filter(ch => isFavorite('canais', idOf(ch)));
  let favSectionHtml = '';
  if (favChannels.length > 0) {
    favSectionHtml = `<section class="sitemap-group channel-category-group channel-fav-group">
      <h3 class="sitemap-group-title">★ Canais Favoritos <span>(${favChannels.length} ${favChannels.length === 1 ? 'canal fixado' : 'canais fixados'})</span></h3>
      <ul class="channel-text-list">${favChannels.map(ch => buildChannelRowHtml(ch, activeChannelId)).join('')}</ul>
    </section>`;
  }

  const catOrder = CHANNEL_CATEGORIES.map(c => c.id).filter(Boolean);
  const byCategory = new Map();
  for (const ch of filtered) {
    const cat = ch.category || 'Variedades';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(ch);
  }
  const sortedCategories = [...byCategory.keys()].sort((a, b) => {
    const ia = catOrder.indexOf(a);
    const ib = catOrder.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  return `<div class="channels-text-container">` + favSectionHtml + sortedCategories.map(catName => {
    const list = byCategory.get(catName) || [];
    const itemsHtml = list.map(ch => buildChannelRowHtml(ch, activeChannelId)).join('');
    return `<section class="sitemap-group channel-category-group">
      <h3 class="sitemap-group-title">${escapeHtml(catName)} <span>(${list.length} ${list.length === 1 ? 'canal' : 'canais'})</span></h3>
      <ul class="channel-text-list">${itemsHtml}</ul>
    </section>`;
  }).join('') + `</div>`;
}

function renderCastButtons(wrapEl, containerEl, castList = []) {
  if (!wrapEl || !containerEl) return;
  if (!Array.isArray(castList) || !castList.length) {
    wrapEl.hidden = true;
    containerEl.innerHTML = '';
    return;
  }
  wrapEl.hidden = false;
  containerEl.innerHTML = castList.map(actor => {
    const role = actor.character ? ` <span class="cast-chip-role">(${escapeHtml(actor.character)})</span>` : '';
    return `<a class="cast-chip" href="/?ator=${encodeURIComponent(actor.name)}" data-actor-link="${escapeHtml(actor.name)}">${escapeHtml(actor.name)}${role}</a>`;
  }).join('');
}

function renderChannelCategories() {
  const filterWrap = $('#channels-filter-bar');
  const isChannels = state.kind === 'canais';
  if (filterWrap) filterWrap.hidden = !isChannels;
  const select = $('#channels-category-select');
  if (!select) return;
  if (!isChannels) return;
  select.innerHTML = CHANNEL_CATEGORIES.map(cat => {
    const isSel = state.channelCategory === cat.id;
    return `<option value="${escapeHtml(cat.id)}"${isSel ? ' selected' : ''}>${escapeHtml(cat.label)}</option>`;
  }).join('');
  select.value = state.channelCategory || '';
}
function renderGenreMenu() {
  const select = $('#category-genre-select');
  const field = $('#category-genre-field');
  const visible = state.kind === 'filme' || state.kind === 'serie';
  if (field) field.hidden = !visible;
  if (!select) return;
  if (!visible) return;
  const genres = state.kind === 'serie'
    ? CATALOG_GENRES.filter(g => g.id !== 'cinema')
    : CATALOG_GENRES;
  select.innerHTML = genres.map(genre => {
    const isSel = state.genre === genre.id;
    return `<option value="${escapeHtml(genre.id)}"${isSel ? ' selected' : ''}>${escapeHtml(genre.label)}</option>`;
  }).join('');
  select.value = state.genre || '';
}
function renderCategorySortBar() {
  const bar = $('#category-sort-bar');
  if (!bar) return;
  const visible = MEDIA_KINDS.has(state.kind) || state.kind === 'platform_category';
  bar.hidden = !visible;
  if (!visible) return;
  const sortSel = $('#category-sort-select');
  const yearSel = $('#category-year-select');
  if (sortSel) sortSel.value = state.categorySort || state.sort || 'recent';
  if (yearSel) yearSel.value = state.categoryYear || '';
}
function renderFavoritesCategories() {
  const bar = $('#favorites-categories');
  if (!bar) return;
  const isFav = state.kind === 'favoritos';
  bar.hidden = !isFav || !state.favorites.length;
  if (!isFav || !state.favorites.length) return;
  bar.innerHTML = FAVORITES_CATEGORIES.map(cat => {
    const active = state.favoritesCategory === cat.id;
    return `<button class="channel-category-btn${active ? ' active' : ''}" type="button" role="tab" aria-selected="${active}" data-favorites-category="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</button>`;
  }).join('');
}
function renderHistoryCategories() {
  const bar = $('#history-categories');
  if (!bar) return;
  const isHistory = state.kind === 'historico';
  bar.hidden = !isHistory || !state.history.length;
  if (!isHistory || !state.history.length) return;
  bar.innerHTML = HISTORY_CATEGORIES.map(cat => {
    const active = state.historyCategory === cat.id;
    return `<button class="channel-category-btn${active ? ' active' : ''}" type="button" role="tab" aria-selected="${active}" data-history-category="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</button>`;
  }).join('');
}
const SITEMAP_KINDS = [
  { id: 'all', label: 'Todo o Catálogo', badge: 'ITEM' },
  { id: 'filme', label: 'Filmes', badge: 'FILME' },
  { id: 'serie', label: 'Séries', badge: 'SÉRIE' },
  { id: 'anime', label: 'Animes', badge: 'ANIME' },
  { id: 'dorama', label: 'Doramas', badge: 'DORAMA' },
  { id: 'desenho', label: 'Desenhos', badge: 'DESENHO' },
  { id: 'novela', label: 'Novelas', badge: 'NOVELA' },
  { id: 'canais', label: 'Canais ao Vivo', badge: 'CANAL' },
];
const SITEMAP_LETTERS = ['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '0-9'];

function renderSitemapSection() {
  const section = $('#sitemap-section');
  if (!section) return;
  const isMapa = state.kind === 'mapa';
  section.hidden = !isMapa;
  if (!isMapa) return;

  const m = state.mapa;
  const isYearSort = m.sort === 'year_desc' || m.sort === 'year_asc';

  document.querySelectorAll('[data-mapa-sort]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mapaSort === m.sort);
  });

  const kindBar = $('#sitemap-kind-bar');
  if (kindBar) {
    kindBar.innerHTML = SITEMAP_KINDS.map(k => {
      const active = m.kind === k.id;
      const countVal = m.counts?.[k.id];
      const countText = countVal != null ? ` (${Number(countVal).toLocaleString('pt-BR')})` : '';
      return `<button class="channel-category-btn${active ? ' active' : ''}" type="button" data-mapa-kind="${escapeHtml(k.id)}">${escapeHtml(k.label)}${escapeHtml(countText)}</button>`;
    }).join('');
  }

  const letterBar = $('#sitemap-letter-bar');
  const yearBar = $('#sitemap-year-bar');
  if (letterBar) {
    letterBar.hidden = isYearSort;
    if (!isYearSort) {
      letterBar.innerHTML = `<span class="sitemap-index-label">Letra:</span>` + SITEMAP_LETTERS.map(l => {
        const active = m.letter === l;
        return `<button class="sitemap-index-btn${active ? ' active' : ''}" type="button" data-mapa-letter="${escapeHtml(l)}">${l === '' ? 'Todas' : escapeHtml(l)}</button>`;
      }).join('');
    }
  }
  if (yearBar) {
    yearBar.hidden = !isYearSort;
    if (isYearSort) {
      const yearsList = ['', ...(m.years || []), 'sem-ano'];
      yearBar.innerHTML = `<span class="sitemap-index-label">Ano:</span>` + yearsList.map(y => {
        const active = m.year === y;
        const label = y === '' ? 'Todos os anos' : y === 'sem-ano' ? 'Sem ano / Ao vivo' : y;
        return `<button class="sitemap-index-btn${active ? ' active' : ''}" type="button" data-mapa-year="${escapeHtml(y)}">${escapeHtml(label)}</button>`;
      }).join('');
    }
  }

  const countEl = $('#sitemap-count');
  const listEl = $('#sitemap-list');
  const pagEl = $('#sitemap-pagination');

  if (m.loading) {
    if (countEl) countEl.textContent = '';
    if (listEl) listEl.innerHTML = '<div class="loading-state"><span class="spinner"></span>Carregando mapa do site…</div>';
    if (pagEl) pagEl.hidden = true;
    return;
  }

  const startNum = m.total > 0 ? (m.page - 1) * m.limit + 1 : 0;
  const endNum = Math.min(m.total, m.page * m.limit);
  if (countEl) {
    countEl.textContent = m.total > 0
      ? `Exibindo ${startNum.toLocaleString('pt-BR')}–${endNum.toLocaleString('pt-BR')} de ${m.total.toLocaleString('pt-BR')} títulos em formato de texto`
      : '0 títulos encontrados';
  }

  if (!m.items.length) {
    if (listEl) listEl.innerHTML = '<div class="empty-state">Nenhum título encontrado com esses filtros no mapa do site.</div>';
    if (pagEl) pagEl.hidden = true;
    return;
  }

  const groups = [];
  let currentGroupKey = null;
  let currentGroupItems = [];
  for (const item of m.items) {
    const gKey = isYearSort
      ? (item.year ? `Ano ${item.year}` : 'Sem ano informado / Canais ao Vivo')
      : `Letra ${item.letter || '#'}`;
    if (gKey !== currentGroupKey) {
      currentGroupKey = gKey;
      currentGroupItems = [];
      groups.push({ title: gKey, items: currentGroupItems });
    }
    currentGroupItems.push(item);
  }

  const badgeByKind = Object.fromEntries(SITEMAP_KINDS.map(k => [k.id, k.badge]));
  if (listEl) {
    listEl.innerHTML = groups.map(group => {
      const rows = group.items.map(item => {
        const badge = badgeByKind[item.kind] || 'ITEM';
        const yearBadge = item.year ? `<span class="sitemap-item-year">${escapeHtml(item.year)}</span>` : (item.category ? `<span class="sitemap-item-year">${escapeHtml(item.category)}</span>` : '');
        return `<li class="sitemap-item">
          <a class="sitemap-item-link" href="${escapeHtml(item.href)}">
            <span class="sitemap-item-badge kind-${escapeHtml(item.kind)}">${escapeHtml(badge)}</span>
            <span class="sitemap-item-title">${escapeHtml(item.title)}</span>
            ${yearBadge}
          </a>
        </li>`;
      }).join('');
      return `<section class="sitemap-group">
        <h3 class="sitemap-group-title">${escapeHtml(group.title)} <span>(${group.items.length})</span></h3>
        <ul class="sitemap-group-list">${rows}</ul>
      </section>`;
    }).join('');
  }

  if (pagEl) {
    const pagHtml = paginationMarkup(m.page, m.total, m.hasMore, 'mapa', m.limit);
    pagEl.innerHTML = pagHtml;
    pagEl.hidden = !pagHtml;
  }
}

async function fetchSitemapPage() {
  const current = ++state.requestId;
  const m = state.mapa;
  m.loading = true;
  render();
  $('#api-notice').hidden = true;
  try {
    const params = new URLSearchParams({
      kind: m.kind || 'all',
      sort: m.sort || 'az',
      page: String(m.page || 1),
      limit: String(m.limit || 500),
    });
    if (m.letter) params.set('letter', m.letter);
    if (m.year) params.set('year', m.year);
    if (m.query) params.set('q', m.query);
    const payload = await requestJson(`/api/mapa?${params}`);
    if (current !== state.requestId) return;
    m.items = Array.isArray(payload.results) ? payload.results : [];
    m.total = Number(payload.total) || 0;
    m.hasMore = Boolean(payload.hasMore);
    if (payload.counts) m.counts = payload.counts;
    if (Array.isArray(payload.years)) m.years = payload.years;
    m.loading = false;
    renderSitemapSection();
  } catch (error) {
    if (current !== state.requestId) return;
    m.loading = false;
    m.items = [];
    renderSitemapSection();
    notice(`Não foi possível carregar o mapa do site. ${error.message}`);
  }
}

function configureFilters() {
  const searchPage = state.kind === 'all';
  const platformPage = state.kind === 'platform';
  const isPlatformCat = state.kind === 'platform_category';
  const historyPage = state.kind === 'historico';
  const favPage = state.kind === 'favoritos';
  const mapaPage = state.kind === 'mapa';
  $('#search-controls').hidden = !searchPage;
  $('#clear-filters').hidden = !searchPage;
  if ($('#clear-all-favorites')) $('#clear-all-favorites').hidden = !favPage || state.favorites.length === 0;
  $('#clear-all-history').hidden = !historyPage || state.history.length === 0;
  $('#catalog-results').hidden = platformPage || mapaPage;
  $('#platform-sections').hidden = !platformPage;
  const backLink = $('#platform-back-link');
  if (backLink) {
    backLink.hidden = !isPlatformCat;
    if (isPlatformCat) {
      backLink.href = `/plataforma/${state.platformSlug}`;
      const backName = $('#platform-back-name');
      if (backName) backName.textContent = state.platform;
    }
  }
  renderChannelCategories();
  renderGenreMenu();
  renderCategorySortBar();
  renderFavoritesCategories();
  renderHistoryCategories();
  renderContinueWatchingSection();
  renderSitemapSection();
}
function render() {
  configureFilters();
  const isPlatformCat = state.kind === 'platform_category';
  const filters = state.searchFilters || {};
  let items = displayItems().filter(item => {
    if (state.kind !== 'all') return true;
    const matchesType = !filters.kind || kindOf(item, filters.kind) === filters.kind;
    const matchesYear = !filters.year || !yearOf(item) || yearOf(item) === filters.year;
    return matchesType && matchesYear;
  });
  if (state.kind === 'all' && filters.sort) state.sort = filters.sort;
  if (!['canais', 'historico', 'favoritos'].includes(state.kind)) items = sortItems(items);
  const label = state.kind === 'platform'
    ? state.platform
    : isPlatformCat
      ? `${LABELS[state.platformCategoryKind] || state.platformCategoryKind} na ${state.platform}`
      : LABELS[state.kind] || 'Buscar';
  $('#page-title').textContent = label;
  $('#page-eyebrow').textContent = (state.kind === 'platform' || isPlatformCat)
    ? `${state.platform.toUpperCase()} · STREAMING`
    : state.kind === 'canais'
      ? 'AO VIVO · TV ONLINE'
      : state.kind === 'favoritos'
        ? 'SUA COLEÇÃO · MINHA LISTA'
        : state.kind === 'historico'
          ? 'SUA SESSÃO · HISTÓRICO'
          : state.kind === 'mapa'
            ? 'ÍNDICE COMPLETO EM TEXTO'
            : 'CATÁLOGO DEEPFLIX';
  $('#intro-copy').textContent = {
    all: 'Pesquise títulos ou explore os lançamentos e destaques abaixo.',
    filme: state.genre === 'cinema'
      ? 'Grandes sucessos e lançamentos que passaram nas salas de cinema.'
      : 'Filmes dublados e legendados para sua próxima sessão.',
    serie: 'Séries completas para acompanhar no seu ritmo.',
    anime: 'Animes dublados e legendados para descobrir.',
    dorama: 'Doramas asiáticos completos para explorar.',
    desenho: 'Desenhos e animações clássicas e atuais.',
    novela: 'Novelas completas organizadas por capítulos.',
    canais: 'Canais de TV ao vivo e Pluto TV (marque ★ para fixar favoritos no topo).',
    favoritos: 'Seus filmes, séries, animes, novelas e canais salvos para assistir quando quiser.',
    historico: state.user
      ? `Olá, ${state.user.name}. Aqui estão os títulos que você assistiu recentemente.`
      : 'Seus títulos assistidos recentemente neste aparelho (entre na sua conta para sincronizar em outros dispositivos).',
    mapa: 'Todo o conteúdo do site em formato de texto, organizado em ordem alfabética (A–Z) ou por ano de lançamento.',
    platform: `Filmes, séries, animes${state.platformSlug === 'globoplay' ? ', novelas' : ''} e doramas disponíveis na ${state.platform}.`,
    platform_category: `Todos os ${LABELS[state.platformCategoryKind] ? LABELS[state.platformCategoryKind].toLowerCase() : 'títulos'} disponíveis na ${state.platform} (50 por página).`,
  }[state.kind] || 'Explore o catálogo.';
  if (isPlatformCat) {
    $('#breadcrumb-current').innerHTML = `<a href="/plataforma/${state.platformSlug}">${escapeHtml(state.platform)}</a> <span class="crumb-separator">/</span> <span>${escapeHtml(LABELS[state.platformCategoryKind] || state.platformCategoryKind)}</span>`;
    const catTitle = $('#catalog-title');
    if (catTitle) catTitle.textContent = `${LABELS[state.platformCategoryKind] || state.platformCategoryKind} · ${state.platform}`;
  } else {
    $('#breadcrumb-current').textContent = label;
    const catTitle = $('#catalog-title');
    if (catTitle) catTitle.textContent = 'Catálogo';
  }
  const activeActorName = state.searchActorInfo?.name || state.searchFilters?.actor || '';
  $('#results-caption').textContent = state.kind === 'all'
    ? state.searchFilters
      ? activeActorName
        ? `Filmes e séries no catálogo com participação de ${activeActorName}${state.searchFilters.query ? ` · filtro “${state.searchFilters.query}”` : ''}`
        : `Resultados para ${state.searchFilters.query ? `“${state.searchFilters.query}”` : 'os filtros selecionados'}`
      : 'Vitrine em destaque · Lançamentos e títulos recentes do catálogo'
    : isPlatformCat
      ? `Catálogo completo de ${LABELS[state.platformCategoryKind] ? LABELS[state.platformCategoryKind].toLowerCase() : 'títulos'} da ${state.platform} (50 títulos por página)`
      : state.kind === 'canais'
      ? (state.channelCategory ? `Lista em texto · ${state.channelCategory} (repetidos agrupados como servidores)` : 'Todos os canais em texto na mesma página (canais repetidos agrupados como servidores)')
      : state.kind === 'favoritos'
        ? 'Clique em um item para assistir ou no ícone ★ para remover da Minha Lista'
        : state.kind === 'historico'
          ? 'Clique em um item para retomar exatamente de onde parou'
          : state.kind === 'mapa'
            ? 'Selecione a ordenação (A–Z ou Ano de lançamento), categoria ou letra inicial'
            : state.genre && ['filme', 'serie'].includes(state.kind)
              ? (state.genre === 'cinema' ? 'Filmes que passaram no cinema (lançamentos e sucessos de bilheteria)' : `${label} · ${CATALOG_GENRES.find(genre => genre.id === state.genre)?.label || ''}`)
              : `${label} para explorar`;
  if (state.kind === 'historico' || state.kind === 'favoritos') {
    state.total = items.length;
    state.page = Math.min(state.page, Math.max(1, Math.ceil(items.length / 50)));
    items = items.slice((state.page - 1) * 50, state.page * 50);
  }
  $('#result-count').textContent = `${state.total == null ? items.length : state.total} ${(state.total == null ? items.length : state.total) === 1 ? 'item' : 'itens'}`;
  const pagination = !['platform', 'mapa', 'canais'].includes(state.kind) ? paginationMarkup(state.page, state.total, state.canLoadMore, '', 50) : '';
  $('#load-more-wrap').innerHTML = pagination;
  $('#load-more-wrap').hidden = !pagination;
  document.querySelectorAll('[data-route]').forEach(link => link.classList.toggle('active', link.dataset.route === state.kind));
  document.querySelectorAll('[data-platform]').forEach(link => {
    const active = link.dataset.platform === state.platformSlug;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (state.kind === 'mapa') {
    return;
  }
  if (state.kind === 'platform') {
    renderPlatformSections();
    return;
  }
  if (state.kind === 'canais') {
    grid.classList.add('channels-text-mode');
    grid.innerHTML = buildChannelsDirectoryHtml(items, '', state.channelFilter, state.channelCategory);
    return;
  }
  grid.classList.remove('channels-text-mode');
  if (!items.length) {
    grid.innerHTML = state.kind === 'historico'
      ? '<div class="empty-state">Seu histórico ainda está vazio. Comece a assistir qualquer filme, série, anime ou novela!</div>'
      : state.kind === 'favoritos'
        ? '<div class="empty-state">Sua Minha Lista ainda está vazia. Clique na estrela ☆ em qualquer filme, série ou canal para salvar aqui!</div>'
        : '<div class="empty-state">Nenhum item encontrado com esses filtros.</div>';
    return;
  }
  grid.innerHTML = items.map((item, index) => card(item, index)).join('');
}
function renderSkeletons(count = 12) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += '<div class="movie-card skeleton-card" aria-hidden="true"><div class="card-poster skeleton-shimmer"></div><div class="card-info"><div class="skeleton-text skeleton-shimmer"></div><div class="skeleton-meta skeleton-shimmer"></div></div></div>';
  }
  return html;
}
function renderPlatformSections() {
  for (const kind of ['filme', 'serie', 'anime', 'dorama', 'novela']) {
    const secEl = document.querySelector(`[data-section-kind="${kind}"]`);
    if (secEl) secEl.hidden = kind === 'novela' && state.platformSlug !== 'globoplay';
    if (kind === 'novela' && state.platformSlug !== 'globoplay') continue;
    const moreLink = document.querySelector(`[data-platform-more="${kind}"]`);
    if (moreLink) {
      moreLink.href = `/plataforma/${state.platformSlug}/${KIND_PLURALS[kind] || kind}`;
    }
    const section = state.platformSections[kind];
    const items = section.items;
    const sectionGrid = document.querySelector(`[data-section-grid="${kind}"]`);
    const count = document.querySelector(`[data-section-count="${kind}"]`);
    if (count) count.textContent = items.length ? `${items.length} ${items.length === 1 ? 'título' : 'títulos'}` : '';
    if (sectionGrid) {
      sectionGrid.innerHTML = section.loading
        ? renderSkeletons(7)
        : items.length ? items.map((item, index) => card(item, index)).join('')
          : '<div class="empty-state">Nenhum título encontrado nesta seção.</div>';
    }
    const moreWrap = document.querySelector(`[data-section-more-wrap="${kind}"]`);
    if (moreWrap) moreWrap.hidden = true;
  }
}
function notice(message) {
  const element = $('#api-notice');
  element.textContent = message;
  element.hidden = false;
}
function showToast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 2600);
}
async function fetchPage(kind) {
  if (kind === 'mapa') {
    await fetchSitemapPage();
    return;
  }
  const current = ++state.requestId;
  state.searchItems = null;
  state.items = [];
  state.canLoadMore = false;
  if (kind === 'historico' || kind === 'favoritos') {
    if (state.user) {
      try {
        if (kind === 'historico') {
          const hist = await requestJson('/api/history?limit=250');
          if (current !== state.requestId) return;
          const cloudHist = (Array.isArray(hist.results) ? hist.results : []).filter(h => h.kind !== 'canais');
          state.history = mergeByKey(cloudHist, loadLocalHistory());
          saveLocalHistory(state.history);
        } else {
          const favs = await requestJson('/api/favorites');
          if (current !== state.requestId) return;
          const cloudFavs = Array.isArray(favs.results) ? favs.results : [];
          state.favorites = mergeByKey(cloudFavs, loadLocalFavorites());
          saveLocalFavorites(state.favorites);
        }
      } catch {}
    }
    render();
    $('#api-notice').hidden = true;
    return;
  }
  if (kind === 'all') {
    state.searchFilters = null;
    state.sort = 'recent';
    render();
    grid.innerHTML = renderSkeletons(12);
    $('#result-count').textContent = '';
    $('#api-notice').hidden = true;
    try {
      const response = await getCatalog('pesquisa', { limit: 50, page: state.page, sort: 'recent' });
      if (current !== state.requestId) return;
      state.items = response.items.map(item => normalizeItem(item, kindOf(item, 'filme')));
      state.total = response.total;
      state.canLoadMore = response.hasMore;
      render();
    } catch (error) {
      if (current !== state.requestId) return;
      grid.innerHTML = '<div class="empty-state">Escolha os filtros e clique em Buscar para consultar o catálogo.</div>';
    }
    return;
  }
  if (kind === 'platform') {
    for (const section of Object.values(state.platformSections)) {
      Object.assign(section, { items: [], page: 1, total: null, canLoadMore: false, loading: true });
    }
    render();
    $('#api-notice').hidden = true;
    const kinds = ['filme', 'serie', 'anime', 'dorama', ...(state.platformSlug === 'globoplay' ? ['novela'] : [])];
    await Promise.all(kinds.map(sectionKind => loadPlatformSection(sectionKind, current)));
    return;
  }
  if (kind === 'platform_category') {
    render();
    grid.innerHTML = renderSkeletons(12);
    $('#api-notice').hidden = true;
    try {
      const options = {
        limit: 50,
        page: state.page,
        sort: state.categorySort || state.sort || 'recent',
        platform: state.platformSlug || state.platform,
      };
      if (state.categoryYear) options.year = state.categoryYear;
      const catKind = state.platformCategoryKind || 'filme';
      const result = await getCatalog(API_CATEGORIES[catKind] || catKind, options);
      if (current !== state.requestId) return;
      state.items = result.items.map(item => normalizeItem(item, catKind));
      state.total = result.total;
      state.canLoadMore = result.hasMore;
      render();
    } catch (error) {
      if (current !== state.requestId) return;
      state.canLoadMore = false;
      notice(`Não foi possível carregar ${LABELS[state.platformCategoryKind] || 'o catálogo'} em ${state.platform}. ${error.message}`);
      grid.innerHTML = '<div class="empty-state">O conteúdo não respondeu. Tente novamente mais tarde.</div>';
      $('#result-count').textContent = '';
    }
    return;
  }
  render();
  grid.innerHTML = renderSkeletons(12);
  $('#api-notice').hidden = true;
  try {
    const options = { limit: kind === 'canais' ? 1000 : 50, page: kind === 'canais' ? 1 : state.page, sort: kind === 'canais' ? '' : state.sort };
    if (['filme', 'serie'].includes(kind) && state.genre) options.genre = state.genre;
    if (MEDIA_KINDS.has(kind) && state.categoryYear) options.year = state.categoryYear;
    const result = await getCatalog(API_CATEGORIES[kind], options);
    if (current !== state.requestId) return;
    state.items = result.items.map(item => normalizeItem(item, kind));
    state.total = result.total;
    state.canLoadMore = kind === 'canais' ? false : result.hasMore;
    render();
  } catch (error) {
    if (current !== state.requestId) return;
    state.canLoadMore = false;
    notice(`Não foi possível carregar ${kind === 'platform' ? state.platform : LABELS[kind] || 'o catálogo'}. ${error.message}`);
    grid.innerHTML = '<div class="empty-state">O conteúdo não respondeu. Tente novamente mais tarde.</div>';
    $('#result-count').textContent = '';
  }
}
async function loadPlatformSection(kind, pageRequestId = state.requestId) {
  const section = state.platformSections[kind];
  const currentSectionRequest = ++section.requestId;
  section.loading = true;
  renderPlatformSections();
  try {
    const rawItems = await getCatalog(API_CATEGORIES[kind], {
      limit: 20,
      page: section.page,
      platform: state.platformSlug || state.platform,
    });
    if (pageRequestId !== state.requestId || currentSectionRequest !== section.requestId) return;
    section.items = rawItems.items.map(item => normalizeItem(item, kind));
    section.total = rawItems.total;
    section.canLoadMore = rawItems.hasMore;
    section.loading = false;
    renderPlatformSections();
  } catch (error) {
    if (pageRequestId !== state.requestId || currentSectionRequest !== section.requestId) return;
    section.loading = false;
    section.canLoadMore = false;
    renderPlatformSections();
    notice(`Não foi possível carregar ${LABELS[kind]} em ${state.platform}. ${error.message}`);
  }
}
async function runSearch(filters = null) {
  let chosen = filters;
  if (!chosen) {
    const rawSearchVal = $('#search-input').value.trim();
    const searchMode = $('#main-search-mode')?.value || 'title';
    const explicitActorVal = $('#actor-filter')?.value.trim() || '';
    const actor = explicitActorVal || (searchMode === 'actor' ? rawSearchVal : '');
    const query = searchMode === 'actor' && !explicitActorVal ? '' : rawSearchVal;
    chosen = {
      query,
      actor,
      kind: $('#kind-filter').value,
      platform: $('#platform-filter').value,
      genre: $('#genre-filter').value,
      year: $('#year-filter').value,
      sort: $('#sort-filter').value,
    };
  }
  state.searchFilters = { ...chosen };
  state.searchActorInfo = null;
  state.sort = chosen.sort || 'recent';
  state.canLoadMore = false;
  state.searchItems = [];
  const current = ++state.requestId;
  $('#api-notice').hidden = true;
  grid.innerHTML = renderSkeletons(12);
  $('#result-count').textContent = '';
  try {
    let results;
    const queryOptions = {
      query: chosen.query,
      actor: chosen.actor,
      genre: chosen.genre,
      year: chosen.year,
      platform: chosen.platform,
      kind: chosen.kind,
      limit: 50,
      page: state.page,
      sort: chosen.sort,
    };
    const response = await getCatalog('pesquisa', queryOptions);
    results = response.items.map(item => normalizeItem(item, kindOf(item, chosen.kind || 'filme')));
    state.total = response.total;
    state.canLoadMore = response.hasMore;
    state.searchActorInfo = response.actor || null;
    if (current !== state.requestId) return;
    state.searchItems = results;
    render();
  } catch (error) {
    if (current !== state.requestId) return;
    state.searchItems = [];
    state.canLoadMore = false;
    render();
    notice(`A busca não respondeu. ${error.message}`);
  }
}
function episodeStill(path) {
  if (!path) return '';
  return /^https?:\/\//i.test(path) ? path : `${IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
function selectedEpisode() {
  return Number($('#episode-jump').value) || 1;
}
let autoNextCountdownTimer = null;
const playTokens = { watch: 0, modal: 0 };

function clearAutoNextCountdown(target = null) {
  if (autoNextCountdownTimer) {
    clearInterval(autoNextCountdownTimer);
    autoNextCountdownTimer = null;
  }
  if (target === 'watch') {
    $('#watch-frame-wrap')?.querySelectorAll('.auto-next-overlay').forEach(el => el.remove());
  } else if (target === 'modal') {
    $('#player-frame-wrap')?.querySelectorAll('.auto-next-overlay').forEach(el => el.remove());
  } else {
    document.querySelectorAll('.auto-next-overlay').forEach(el => el.remove());
  }
}

function renderSimilarSection(wrapEl, gridEl, similarList = []) {
  if (!wrapEl || !gridEl) return;
  if (!Array.isArray(similarList) || !similarList.length) {
    wrapEl.hidden = true;
    gridEl.innerHTML = '';
    return;
  }
  wrapEl.hidden = false;
  gridEl.innerHTML = similarList.map((item, idx) => card(normalizeItem(item, item.kind || 'filme'), idx)).join('');
}

function openTrailerModal(trailerKey, title = 'Trailer') {
  if (!trailerKey) return showToast('Trailer indisponível para este título.');
  const dlg = $('#player-dialog');
  const wrap = $('#player-frame-wrap');
  const opts = $('#modal-player-options');
  const epNav = $('#player-episode-nav');
  destroyHls('modal');
  if (opts) { opts.hidden = true; opts.innerHTML = ''; }
  if (epNav) epNav.hidden = true;
  $('#player-title').textContent = `🎬 Trailer — ${title}`;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(trailerKey)}?autoplay=1&rel=0`;
  iframe.allow = 'autoplay *; encrypted-media *; picture-in-picture *; fullscreen *';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');
  iframe.title = `Trailer de ${title}`;
  wrap.replaceChildren(iframe);
  if (dlg && !dlg.open) dlg.showModal();
}

function isEpisodeWatched(savedEntry, seasonNum, epNum) {
  if (!savedEntry || !savedEntry.season || !savedEntry.episode) return false;
  const s = Number(seasonNum);
  const e = Number(epNum);
  const savedS = Number(savedEntry.season);
  const savedE = Number(savedEntry.episode);
  if (s < savedS) return true;
  if (s === savedS && e < savedE) return true;
  return false;
}

function renderEpisodes() {
  const data = state.episodeData;
  const list = $('#episode-list');
  const jump = $('#episode-jump');
  if (!data) {
    list.innerHTML = '';
    jump.innerHTML = '';
    return;
  }
  const episodes = [...(data.episodes || [])].sort((a, b) => Number(a.episode_number) - Number(b.episode_number));
  jump.innerHTML = episodes.map(episode => `<option value="${Number(episode.episode_number)}">${Number(episode.episode_number)}. ${escapeHtml(episode.name)}</option>`).join('');
  const preferred = Number($('#episode-jump').dataset.preferredEpisode || jump.value) || Number(episodes[0]?.episode_number) || 1;
  if (episodes.some(episode => Number(episode.episode_number) === preferred)) jump.value = String(preferred);
  delete jump.dataset.preferredEpisode;

  const filterTerm = normalizeSearchStr(state.episodeFilter || $('#episode-filter')?.value || '');
  const filteredEps = filterTerm
    ? episodes.filter(ep => normalizeSearchStr(`${ep.episode_number} ${ep.name || ''} ${ep.overview || ''}`).includes(filterTerm))
    : episodes;
  const ordered = $('#episode-reverse').checked ? [...filteredEps].reverse() : filteredEps;
  const saved = state.selected ? findHistoryEntry(state.selected.kind, idOf(state.selected.item)) : null;

  const dateLabel = value => {
    if (!value) return 'Disponível';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date);
  };
  list.innerHTML = ordered.map(episode => {
    const epNum = Number(episode.episode_number);
    const still = episodeStill(episode.still_path);
    const watched = isEpisodeWatched(saved, data.season, epNum);
    const isCurrentSaved = saved && Number(saved.season) === Number(data.season) && Number(saved.episode) === epNum;
    const watchedBadge = watched
      ? ' <span class="episode-watched-badge">✓ Assistido</span>'
      : isCurrentSaved
        ? ' <span class="episode-watched-badge in-progress">▶ Em andamento</span>'
        : '';
    return `<article class="episode-card${watched ? ' watched' : ''}${isCurrentSaved ? ' current' : ''}" id="episode-${epNum}">
      <div class="episode-still">${still ? `<img loading="lazy" src="${escapeHtml(still)}" alt="">` : '<span>▶</span>'}</div>
      <button class="episode-play" type="button" data-watch-episode="${epNum}" aria-label="Assistir episódio ${epNum}"><span aria-hidden="true">▶</span> Play</button>
      <div class="episode-card-copy"><p class="episode-number">EPISÓDIO ${epNum} · ${escapeHtml(dateLabel(episode.air_date))}${watchedBadge}</p>
      <h4>${escapeHtml(episode.name)}</h4><p class="episode-overview">${escapeHtml(episode.overview || 'Episódio disponível no catálogo.')}</p></div>
    </article>`;
  }).join('') || '<div class="empty-state">Nenhum episódio encontrado com esse filtro.</div>';
  const season = data.seasons?.find(entry => Number(entry.season_number) === Number(data.season));
  $('#episodes-heading').textContent = season?.name || `Temporada ${data.season}`;
  $('#episode-status').textContent = `${filteredEps.length} de ${episodes.length} ${episodes.length === 1 ? 'episódio' : 'episódios'}`;
  const selEp = selectedEpisode();
  const isResuming = saved && Number(saved.season) === Number(data.season) && Number(saved.episode) === selEp;
  $('#detail-play').innerHTML = `${isResuming ? 'Continuar' : 'Assistir'} T${data.season}:E${selEp} <span aria-hidden="true">▶</span>`;
  renderPlayerEpisodeNav();
}
async function loadEpisodes(item, season = 1, preferredEpisode = 1) {
  const requestId = ++state.episodeRequestId;
  const id = idOf(item);
  const kind = item?.__kind || state.selected?.kind || 'serie';
  state.episodeData = null;
  $('#episode-status').textContent = 'Carregando episódios…';
  $('#episode-list').innerHTML = '<div class="loading-state"><span class="spinner"></span>Carregando episódios…</div>';
  $('#episode-jump').dataset.preferredEpisode = String(preferredEpisode);
  const saved = findHistoryEntry(kind, id);
  const isResuming = saved && Number(saved.season) === Number(season) && Number(saved.episode) === Number(preferredEpisode);
  $('#detail-play').innerHTML = `${isResuming ? 'Continuar' : 'Assistir'} T${season}:E${preferredEpisode} <span aria-hidden="true">▶</span>`;
  try {
    const data = await requestJson(`/api/series/${encodeURIComponent(id)}?season=${encodeURIComponent(season)}&kind=${encodeURIComponent(kind)}`);
    if (requestId !== state.episodeRequestId || !state.selected || idOf(state.selected.item) !== id) return;
    state.episodeData = data;
    renderCastButtons($('#detail-cast-wrap'), $('#detail-cast'), data.details?.cast || []);
    renderSimilarSection($('#detail-similar-wrap'), $('#detail-similar-grid'), data.details?.similar || []);
    const trailerBtn = $('#detail-trailer-btn');
    if (trailerBtn) {
      trailerBtn.hidden = !data.details?.trailerKey;
      trailerBtn.dataset.trailerKey = data.details?.trailerKey || '';
      trailerBtn.dataset.trailerTitle = data.details?.title || titleOf(item);
    }
    const seasonSelect = $('#season-select');
    seasonSelect.innerHTML = (data.seasons || []).map(entry => `<option value="${Number(entry.season_number)}">${escapeHtml(entry.name)}${entry.air_date ? ` (${escapeHtml(entry.air_date.slice(0, 4))})` : ''}</option>`).join('');
    if (data.seasons?.some(entry => Number(entry.season_number) === Number(data.season))) seasonSelect.value = String(data.season);
    renderEpisodes();
    if (!data.episodes?.length) $('#episode-status').textContent = 'Não encontramos episódios para esta temporada.';
  } catch (error) {
    if (requestId !== state.episodeRequestId) return;
    state.episodeData = null;
    $('#episode-list').innerHTML = '<div class="empty-state">A lista detalhada de episódios não está disponível agora.</div>';
    $('#episode-status').textContent = error.message;
  }
}
async function openDetails(item, kind, season = null, episode = null) {
  if (MEDIA_KINDS.has(kind)) {
    const id = idOf(item);
    if (!id) return showToast('Este título não tem um identificador válido.');
    const saved = findHistoryEntry(kind, id);
    const targetSeason = season || saved?.season || 1;
    const targetEpisode = episode || saved?.episode || 1;
    const route = `/assistir/${kind}/${encodeURIComponent(id)}${EPISODIC_KINDS.has(kind) ? `/${Math.max(1, Number(targetSeason) || 1)}/${Math.max(1, Number(targetEpisode) || 1)}` : ''}`;
    window.location.assign(route);
    return;
  }
  if (kind === 'canais') {
    window.location.assign(`/assistir/canais/${encodeURIComponent(idOf(item))}`);
    return;
  }
  state.selected = { item, kind };
  state.episodeFilter = '';
  if ($('#episode-filter')) $('#episode-filter').value = '';
  const title = titleOf(item), image = imageOf(item), year = yearOf(item), rating = item?.vote_average || item?.rating;
  $('#detail-type').textContent = (LABELS[kind] || 'TÍTULO').toLocaleUpperCase('pt-BR');
  $('#detail-title').textContent = title;
  const channelDetails = [item?.category_name || item?.category, item?.language, item?.quality].filter(Boolean).join(' · ');
  $('#detail-overview').textContent = item?.overview || item?.description || item?.sinopse || item?.summary || channelDetails || 'Informações adicionais indisponíveis para este item.';
  const displayDate = displayDateOf(item);
  $('#detail-meta').innerHTML = [displayDate || year, rating ? `★ ${Number(rating).toFixed(1)}` : '', item?.runtime ? `${item.runtime} min` : ''].filter(Boolean).map(value => `<span>${escapeHtml(value)}</span>`).join('');
  $('#detail-platforms').innerHTML = platformsOf(item).map(name => `<span>${escapeHtml(name)}</span>`).join('');
  $('#detail-backdrop').style.backgroundImage = image ? `linear-gradient(90deg,#111015 0%,rgba(17,16,21,.95) 60%,rgba(17,16,21,.72)),url("${escapeHtml(image)}")` : '';
  const hasEpisodes = EPISODIC_KINDS.has(kind);
  const saved = findHistoryEntry(kind, idOf(item));
  const normSeason = Math.max(1, Number(season || saved?.season) || 1);
  const normEpisode = Math.max(1, Number(episode || saved?.episode) || 1);
  $('#episode-browser').hidden = !hasEpisodes;
  $('#episode-reverse').checked = false;
  $('#season-select').innerHTML = `<option value="${normSeason}">Temporada ${normSeason}</option>`;
  $('#episode-jump').innerHTML = `<option value="${normEpisode}">${normEpisode}</option>`;
  $('#episode-list').innerHTML = '';
  $('#episode-status').textContent = hasEpisodes ? 'Carregando episódios…' : '';
  state.episodeData = null;
  const action = $('#detail-play');
  action.hidden = false;
  action.innerHTML = kind === 'canais' ? 'Assistir canal ▶' : hasEpisodes ? `${saved ? 'Continuar' : 'Assistir'} T${normSeason}:E${normEpisode} ▶` : 'Assistir agora ▶';
  syncFavoriteButtonsState();
  $('#detail-dialog').showModal();
  if (hasEpisodes && idOf(item)) loadEpisodes(item, normSeason, normEpisode);
}

function destroyHls(target) {
  clearAutoNextCountdown(target);
  if (target === 'watch' && activeWatchHls) {
    try { activeWatchHls.destroy(); } catch {}
    activeWatchHls = null;
  }
  if (target === 'modal' && activeModalHls) {
    try { activeModalHls.destroy(); } catch {}
    activeModalHls = null;
  }
  const wrap = target === 'watch' ? $('#watch-frame-wrap') : $('#player-frame-wrap');
  if (wrap) {
    wrap.querySelectorAll('video').forEach(v => {
      try {
        v.pause();
        v.removeAttribute('src');
        v.load();
      } catch {}
    });
    wrap.querySelectorAll('iframe').forEach(f => {
      try { f.src = 'about:blank'; } catch {}
    });
  }
}

function safePlayVideo(video) {
  const p = video.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      video.muted = true;
      video.play().then(() => {
        showToast('Reprodução iniciada sem som — toque no vídeo para ativar o áudio.');
      }).catch(() => {});
    });
  }
}

function hasNextEpisodeAvailable(target) {
  if (target === 'watch' && state.watch && EPISODIC_KINDS.has(state.watch.kind)) {
    const seasons = (state.watch.data?.seasons || []).filter(s => Number(s.season_number) > 0).sort((a, b) => a.season_number - b.season_number);
    const idx = seasons.findIndex(s => Number(s.season_number) === state.watch.season);
    const curS = seasons[idx];
    return Boolean((curS?.episode_count && state.watch.episode < curS.episode_count) || (idx >= 0 && idx < seasons.length - 1));
  }
  if (target === 'modal' && state.playback && EPISODIC_KINDS.has(state.playback.kind)) {
    const seasons = (state.episodeData?.seasons || []).filter(s => Number(s.season_number) > 0).sort((a, b) => a.season_number - b.season_number);
    const idx = seasons.findIndex(s => Number(s.season_number) === state.playback.season);
    const curS = seasons[idx];
    return Boolean((curS?.episode_count && state.playback.episode < curS.episode_count) || (idx >= 0 && idx < seasons.length - 1));
  }
  return false;
}

function startAutoNextCountdown(container, target) {
  clearAutoNextCountdown();
  if (!state.autoNextEpisode || !hasNextEpisodeAvailable(target)) return;
  let remaining = 10;
  const overlay = document.createElement('div');
  overlay.className = 'auto-next-overlay';
  const updateHtml = () => {
    overlay.innerHTML = `<div class="auto-next-card">
      <p class="eyebrow">MODO MARATONA ATIVO</p>
      <h4>Próximo episódio em <span class="auto-next-sec">${remaining}s</span>…</h4>
      <div class="auto-next-actions">
        <button class="watch-button auto-next-now" type="button">Assistir Agora ▶</button>
        <button class="clear-filters auto-next-cancel" type="button">Cancelar</button>
      </div>
    </div>`;
    overlay.querySelector('.auto-next-now')?.addEventListener('click', () => {
      clearAutoNextCountdown();
      if (target === 'watch') stepWatchEpisode(1);
      else stepEpisode(1);
    });
    overlay.querySelector('.auto-next-cancel')?.addEventListener('click', () => {
      clearAutoNextCountdown();
    });
  };
  updateHtml();
  container.appendChild(overlay);
  autoNextCountdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearAutoNextCountdown();
      if (target === 'watch') stepWatchEpisode(1);
      else stepEpisode(1);
      return;
    }
    const secEl = overlay.querySelector('.auto-next-sec');
    if (secEl) secEl.textContent = `${remaining}s`;
  }, 1000);
}

function mountOptionInContainer(container, option, target, titleText = 'Player', resumeSeconds = 0, onTimeReport = null, onPlaybackError = null) {
  destroyHls(target);
  if (!option || !option.url) {
    container.innerHTML = '<div class="empty-state">Nenhuma fonte de reprodução disponível para esta opção.</div>';
    return;
  }
  if (option.kind === 'iframe') {
    const iframe = document.createElement('iframe');
    if (target === 'watch') iframe.id = 'watch-frame';
    iframe.src = option.url;
    iframe.allow = 'autoplay *; encrypted-media *; picture-in-picture *; fullscreen *; clipboard-write *; accelerometer *; gyroscope *';
    iframe.allowFullscreen = true;
    iframe.setAttribute('webkitallowfullscreen', '');
    iframe.setAttribute('mozallowfullscreen', '');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('autoplay', '1');
    iframe.autoplay = true;
    iframe.title = titleText;
    container.replaceChildren(iframe);
    return;
  }

  const video = document.createElement('video');
  if (target === 'watch') video.id = 'watch-video';
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';

  if (option.subtitle) {
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Português';
    track.srclang = 'pt';
    track.src = option.subtitle;
    track.default = true;
    video.appendChild(track);
  }

  let seekApplied = false;
  const applyResumeSeek = () => {
    if (seekApplied) return;
    seekApplied = true;
    if (resumeSeconds > 5 && (!Number.isFinite(video.duration) || resumeSeconds < video.duration - 15)) {
      try {
        video.currentTime = resumeSeconds;
        showToast(`Retomando em ${formatDuration(resumeSeconds)}`);
      } catch {}
    }
  };
  video.addEventListener('loadedmetadata', applyResumeSeek, { once: true });

  if (typeof onTimeReport === 'function') {
    let lastReportedAt = 0;
    let nextPrefetched = false;
    video.addEventListener('timeupdate', () => {
      if (!video.isConnected) return;
      const now = Date.now();
      if (now - lastReportedAt >= 10000 && video.currentTime > 3) {
        lastReportedAt = now;
        onTimeReport(Math.floor(video.currentTime), Math.floor(video.duration || 0));
      }
      // Pré-carregamento silencioso do próximo episódio nos créditos finais
      if (!nextPrefetched && Number.isFinite(video.duration) && video.duration > 40 && (video.duration - video.currentTime) < 55) {
        nextPrefetched = true;
        if (hasNextEpisodeAvailable(target)) {
          if (target === 'watch' && state.watch) {
            const nextEp = state.watch.episode + 1;
            requestJson(`/api/play?kind=${encodeURIComponent(state.watch.kind)}&id=${encodeURIComponent(state.watch.id)}&season=${state.watch.season}&episode=${nextEp}`).catch(() => {});
          } else if (target === 'modal' && state.playback) {
            const nextEp = state.playback.episode + 1;
            requestJson(`/api/play?kind=${encodeURIComponent(state.playback.kind)}&id=${encodeURIComponent(idOf(state.playback.item))}&season=${state.playback.season}&episode=${nextEp}`).catch(() => {});
          }
        }
      }
    });
    video.addEventListener('pause', () => {
      if (!video.isConnected) return;
      if (video.currentTime > 3) {
        onTimeReport(Math.floor(video.currentTime), Math.floor(video.duration || 0));
      }
    });
  }

  video.addEventListener('ended', () => {
    if (!video.isConnected) return;
    startAutoNextCountdown(container, target);
  });

  let fallbackTriggered = false;
  const triggerFallback = () => {
    if (!video.isConnected || fallbackTriggered || typeof onPlaybackError !== 'function') return;
    fallbackTriggered = true;
    onPlaybackError();
  };

  container.replaceChildren(video);

  const isHls = option.kind === 'hls' || /\.m3u8(\?|$)/i.test(option.url);
  if (isHls && window.Hls && window.Hls.isSupported()) {
    const hls = new window.Hls({
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      maxBufferSize: 60 * 1000 * 1000,
      backBufferLength: 30,
    });
    if (target === 'watch') activeWatchHls = hls;
    else activeModalHls = hls;
    hls.loadSource(option.url);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      applyResumeSeek();
      safePlayVideo(video);
    });
    let mediaRecoveryAttempts = 0;
    hls.on(window.Hls.Events.ERROR, (_event, data) => {
      if (!data?.fatal) return;
      if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveryAttempts < 1) {
        mediaRecoveryAttempts += 1;
        hls.recoverMediaError();
        return;
      }
      triggerFallback();
    });
  } else {
    video.addEventListener('error', triggerFallback, { once: true });
    video.src = option.url;
    safePlayVideo(video);
  }
}

function getActiveVideoElement(target = null) {
  if (target === 'modal' || $('#player-dialog')?.open) {
    return $('#player-frame-wrap video');
  }
  return $('#watch-video') || $('#watch-frame-wrap video') || $('#player-frame-wrap video');
}

const FS_ENTER_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
const FS_EXIT_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M14 4h6m-6 0v6m6-6l-7 7M10 4H4m6 0v6m-6-6l7 7"/></svg>';

function toggleTheaterMode(forceState) {
  const layout = $('#watch-layout');
  if (!layout) return;
  state.theaterMode = typeof forceState === 'boolean' ? forceState : !state.theaterMode;
  layout.classList.toggle('theater-mode', state.theaterMode);
  document.querySelectorAll('[data-quick-theater]').forEach(btn => {
    btn.classList.toggle('active', state.theaterMode);
    btn.setAttribute('aria-pressed', String(state.theaterMode));
  });
}

function updateFullscreenButtons() {
  const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  document.querySelectorAll('[data-quick-fullscreen]').forEach(btn => {
    btn.classList.toggle('active', isFs);
    btn.setAttribute('aria-pressed', String(isFs));
    btn.title = isFs ? 'Sair da Tela Cheia (Tecla Esc ou F)' : 'Tela Cheia (Tecla F)';
    const enterSpan = btn.querySelector('.quick-fs-enter');
    const exitSpan = btn.querySelector('.quick-fs-exit');
    if (enterSpan) enterSpan.hidden = isFs;
    if (exitSpan) exitSpan.hidden = !isFs;
  });
}

function togglePlayerFullscreen(target = 'watch') {
  const isDialog = target === 'player' || $('#player-dialog')?.open;
  const wrap = isDialog ? $('#player-frame-wrap') : ($('#watch-frame-wrap') || document.querySelector('.watch-frame-wrap') || getActiveVideoElement(target));
  if (!wrap) return;

  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document).catch(() => {});
  } else {
    (wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen)?.call(wrap).catch(() => {
      showToast('Não foi possível ativar tela cheia.');
    });
  }
}

document.addEventListener('fullscreenchange', updateFullscreenButtons);
document.addEventListener('webkitfullscreenchange', updateFullscreenButtons);

function renderPlayerOptionsBar(barElement, options, activeIndex, onSelect, context = {}) {
  if (!barElement) return;
  if (!Array.isArray(options) || options.length === 0) {
    barElement.hidden = true;
    barElement.innerHTML = '';
    return;
  }
  barElement.hidden = false;

  const { target = 'watch', kind = 'filme' } = context;
  const currentOption = options[activeIndex] || options[0];
  const audioTypes = [...new Set(options.map(o => o.audio).filter(a => a && a !== 'Ao Vivo'))];
  const hasMultipleAudios = audioTypes.length > 1;
  const activeAudio = currentOption?.audio || audioTypes[0] || '';

  const filteredOptions = hasMultipleAudios
    ? options.map((opt, originalIdx) => ({ ...opt, originalIdx })).filter(opt => opt.audio === activeAudio)
    : options.map((opt, originalIdx) => ({ ...opt, originalIdx }));

  let audioTabsHtml = '';
  if (hasMultipleAudios) {
    audioTabsHtml = `<div class="player-audio-tabs"><span class="player-options-label">Áudio:</span>` +
      audioTypes.map(audio => {
        const isActive = audio === activeAudio;
        const icon = audio === 'Dublado' ? '🇧🇷 ' : (audio === 'Legendado' ? '💬 ' : '');
        return `<button class="player-audio-btn${isActive ? ' active' : ''}" type="button" data-audio-select="${escapeHtml(audio)}">${icon}${escapeHtml(audio)}</button>`;
      }).join('') +
      `</div>`;
  }

  const serversHtml = `<div class="player-servers-row"><span class="player-options-label">Servidores:</span>` +
    filteredOptions.map((opt, subIdx) => {
      const isSelected = opt.originalIdx === activeIndex;
      const label = opt.server || opt.label || `Servidor ${subIdx + 1}`;
      return `<button class="player-option-btn${isSelected ? ' active' : ''}" type="button" data-option-idx="${opt.originalIdx}">${escapeHtml(label)}</button>`;
    }).join('') +
    `</div>`;

  barElement.innerHTML = audioTabsHtml + serversHtml;

  barElement.querySelectorAll('[data-audio-select]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetAudio = btn.dataset.audioSelect;
      const targetIdx = options.findIndex(o => o.audio === targetAudio);
      if (targetIdx >= 0) onSelect(targetIdx);
    });
  });

  barElement.querySelectorAll('[data-option-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.optionIdx) || 0;
      onSelect(idx);
    });
  });
}

async function loadAndPlayTarget({ kind, id, season = 1, episode = 1, target = 'watch', titleText = 'Player', itemMeta = null }) {
  const token = ++playTokens[target];
  const seriesKey = `${kind}:${id}`;
  if (state.autoNextSeriesKey !== seriesKey) {
    state.autoNextEpisode = false;
    state.autoNextSeriesKey = seriesKey;
  }
  const container = target === 'watch' ? $('#watch-frame-wrap') : $('#player-frame-wrap');
  const optionsBar = target === 'watch' ? $('#watch-player-options') : $('#modal-player-options');
  destroyHls(target);
  container.innerHTML = '<div class="loading-state"><span class="spinner"></span>Carregando servidores…</div>';
  if (optionsBar) {
    optionsBar.hidden = true;
    optionsBar.innerHTML = '';
  }

  const savedEntry = findHistoryEntry(kind, id);
  const sameEpisodeAsSaved = savedEntry && (
    !EPISODIC_KINDS.has(kind) ||
    (Number(savedEntry.season) === Number(season) && Number(savedEntry.episode) === Number(episode))
  );
  const resumeSeconds = sameEpisodeAsSaved ? (Number(savedEntry.currentTime) || 0) : 0;

  const params = new URLSearchParams({
    kind,
    id: String(id),
    season: String(season || 1),
    episode: String(episode || 1),
  });
  try {
    const payload = await requestJson(`/api/play?${params}`);
    if (token !== playTokens[target]) return;
    if (target === 'watch' && kind === 'canais') {
      $('#watch-type').textContent = 'CANAL AO VIVO';
      $('#watch-title').textContent = payload.title || titleText;
      $('#watch-episode-title').hidden = true;
      $('#watch-meta').innerHTML = payload.category ? `<span>${escapeHtml(payload.category)}</span><span>AO VIVO</span>` : '<span>AO VIVO</span>';
      $('#watch-overview').textContent = payload.category ? `Transmissão ao vivo · ${payload.category}` : 'Transmissão ao vivo.';
      $('#watch-genres').textContent = payload.category || '';
      if (payload.poster) {
        $('#watch-info').style.backgroundImage = `linear-gradient(90deg,#111015 0%,rgba(17,16,21,.94) 70%,rgba(17,16,21,.85)),url("${escapeHtml(payload.poster)}")`;
      }
      document.title = `${payload.title || 'Canal'} — DEEPFLIX`;
      renderWatchChannelZapping(payload.title || titleText);
      syncFavoriteButtonsState();
    }
    const options = Array.isArray(payload?.options) ? payload.options : [];
    if (!options.length) {
      container.innerHTML = '<div class="empty-state">Nenhum servidor disponível para este conteúdo no momento.</div>';
      return;
    }

    let preferredIndex = 0;
    if (savedEntry?.serverLabel) {
      const foundIdx = options.findIndex(o => (o.server || o.label) === savedEntry.serverLabel && (!savedEntry.audio || o.audio === savedEntry.audio));
      if (foundIdx >= 0) preferredIndex = foundIdx;
    }

    const triedIndices = new Set();

    const buildProgressPayload = (chosenOpt, idx, currentTime = 0, duration = 0) => {
      const watchDetails = target === 'watch' ? state.watch?.data?.details : null;
      const isCurrentWatchSeason = target === 'watch' && Number(state.watch?.season) === Number(season);
      const watchEp = isCurrentWatchSeason ? state.watch?.data?.episodes?.find(e => Number(e.episode_number) === Number(episode)) : null;
      const modalEp = target === 'modal' ? state.episodeData?.episodes?.find(e => Number(e.episode_number) === Number(episode)) : null;
      const epName = watchEp?.name || modalEp?.name || '';
      return {
        kind,
        itemId: String(id),
        title: payload.title || watchDetails?.title || itemMeta?.title || itemMeta?.name || titleText,
        poster: payload.poster || watchDetails?.poster_path || itemMeta?.poster || itemMeta?.poster_path || '',
        backdrop: watchDetails?.backdrop_path || itemMeta?.backdrop || itemMeta?.backdrop_path || payload.poster || '',
        year: String(watchDetails?.release_date || watchDetails?.first_air_date || itemMeta?.year || '').slice(0, 4),
        season: EPISODIC_KINDS.has(kind) ? Number(season) || 1 : 0,
        episode: EPISODIC_KINDS.has(kind) ? Number(episode) || 1 : 0,
        episodeTitle: epName,
        serverLabel: chosenOpt?.server || chosenOpt?.label || '',
        audio: chosenOpt?.audio || '',
        optionIndex: idx,
        currentTime,
        duration,
      };
    };

    const selectOption = (index, isInitial = false) => {
      if (token !== playTokens[target]) return;
      triedIndices.add(index);
      const chosen = options[index] || options[0];
      const activeVid = getActiveVideoElement(target);
      const curVidPos = Math.floor(activeVid?.currentTime || 0);
      const startSec = isInitial ? resumeSeconds : (curVidPos > 3 ? curVidPos : (resumeSeconds || 0));
      const handleFallback = () => {
        if (token !== playTokens[target]) return;
        if (options.length <= 1) return;
        let nextIdx = options.findIndex((o, idx) => !triedIndices.has(idx) && o.audio === chosen.audio);
        if (nextIdx < 0) nextIdx = options.findIndex((_o, idx) => !triedIndices.has(idx));
        if (nextIdx >= 0) {
          const nextSrv = options[nextIdx];
          const nextName = nextSrv?.server || nextSrv?.label || `Servidor ${nextIdx + 1}`;
          showToast(`Servidor instável. Alternando automaticamente para ${nextName}…`);
          selectOption(nextIdx, false);
        } else {
          showToast('Todos os servidores automáticos falharam.');
        }
      };
      mountOptionInContainer(
        container,
        chosen,
        target,
        titleText,
        startSec,
        (curTime, dur) => {
          if (token !== playTokens[target]) return;
          recordWatchProgress(buildProgressPayload(chosen, index, curTime, dur));
        },
        handleFallback
      );
      renderPlayerOptionsBar(optionsBar, options, index, idx => {
        triedIndices.clear();
        selectOption(idx, false);
      }, { target, kind });
      recordWatchProgress(buildProgressPayload(chosen, index, startSec, savedEntry?.duration || 0));
    };
    selectOption(preferredIndex, true);
  } catch (error) {
    container.innerHTML = `<div class="empty-state">Não foi possível abrir o player: ${escapeHtml(error.message)}</div>`;
  }
}

function openMediaPlayer(item, kind, season = 1, episode = 1) {
  const id = idOf(item);
  if (!id) return showToast('Este item não tem um identificador de reprodução.');
  const film = kind === 'filme';
  const normSeason = film ? 1 : Math.max(1, Number(season) || 1);
  const normEpisode = film ? 1 : Math.max(1, Number(episode) || 1);
  state.playback = { item, kind, season: film ? 0 : normSeason, episode: film ? 0 : normEpisode };
  renderPlayerEpisodeNav();
  $('#player-title').textContent = titleOf(item);
  $('#detail-dialog').close();
  if (!$('#player-dialog').open) $('#player-dialog').showModal();
  loadAndPlayTarget({
    kind,
    id,
    season: normSeason,
    episode: normEpisode,
    target: 'modal',
    titleText: `Player de ${titleOf(item)}`,
    itemMeta: item,
  });
}

function openChannelPlayer(item) {
  const id = idOf(item);
  if (!id) return showToast('Este canal não tem um identificador válido.');
  window.location.assign(`/assistir/canais/${encodeURIComponent(id)}`);
}

function renderPlayerEpisodeNav() {
  const playback = state.playback;
  const visible = playback && EPISODIC_KINDS.has(playback.kind);
  $('#player-episode-nav').hidden = !visible;
  if (!visible) return;
  const episodes = state.episodeData?.episodes || [];
  const current = episodes.find(episode => Number(episode.episode_number) === playback.episode);
  const seasons = (state.episodeData?.seasons || []).filter(season => Number(season.season_number) > 0).sort((a, b) => a.season_number - b.season_number);
  const season = seasons.find(entry => Number(entry.season_number) === playback.season);
  const index = seasons.findIndex(entry => Number(entry.season_number) === playback.season);
  const hasPrevious = playback.episode > 1 || index > 0;
  const hasNext = (season?.episode_count && playback.episode < season.episode_count) || index >= 0 && index < seasons.length - 1;
  $('#previous-episode').disabled = !hasPrevious;
  $('#next-episode').disabled = !hasNext;
  $('#player-episode-label').textContent = `Temporada ${playback.season} · Episódio ${playback.episode}${current?.name ? ` — ${current.name}` : ''}`;
}
function stepEpisode(direction) {
  const playback = state.playback;
  if (!playback) return;
  const seasons = (state.episodeData?.seasons || []).filter(season => Number(season.season_number) > 0).sort((a, b) => a.season_number - b.season_number);
  const index = seasons.findIndex(season => Number(season.season_number) === playback.season);
  const season = seasons[index];
  let nextSeason = playback.season;
  let nextEpisode = playback.episode + direction;
  if (nextEpisode < 1 && index > 0) {
    nextSeason = Number(seasons[index - 1].season_number);
    nextEpisode = Number(seasons[index - 1].episode_count) || 1;
  } else if (season?.episode_count && nextEpisode > season.episode_count && index >= 0 && index < seasons.length - 1) {
    nextSeason = Number(seasons[index + 1].season_number);
    nextEpisode = 1;
  }
  if (nextSeason === playback.season && nextEpisode === playback.episode) return;
  openMediaPlayer(playback.item, playback.kind, nextSeason, nextEpisode);
  if (nextSeason !== playback.season) loadEpisodes(playback.item, nextSeason, nextEpisode);
}
function updateWatchRoute() {
  const watch = state.watch;
  const suffix = watch.kind === 'filme' ? '' : `/${watch.season}/${watch.episode}`;
  history.pushState({}, '', `/assistir/${watch.kind}/${encodeURIComponent(watch.id)}${suffix}`);
}
function renderWatchInfo() {
  const watch = state.watch;
  const data = watch.data?.details || {};
  const itemTitle = data.title || watch.data?.name || `Título ${watch.id}`;
  const episode = watch.data?.episodes?.find(entry => Number(entry.episode_number) === watch.episode);
  const isFilm = watch.kind === 'filme';
  $('#watch-type').textContent = isFilm ? 'FILME' : ({
    serie: 'SÉRIE',
    anime: 'ANIME',
    dorama: 'DORAMA',
    desenho: 'DESENHO',
    novela: 'NOVELA',
  }[watch.kind] || 'SÉRIE');
  $('#watch-title').textContent = itemTitle;
  document.title = `${episode?.name ? `${episode.name} — ` : ''}${itemTitle} — DEEPFLIX`;
  $('#watch-episode-title').hidden = isFilm;
  $('#watch-episode-title').textContent = episode ? `T${watch.season}:E${watch.episode} · ${episode.name}` : `Temporada ${watch.season} · Episódio ${watch.episode}`;
  const rawDate = data.release_date || data.first_air_date || data.date || '';
  let dateText = (rawDate || '').slice(0, 4);
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [y, m, d] = rawDate.split('-');
    dateText = `${d}/${m}/${y}`;
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
    dateText = rawDate;
  }
  const meta = [dateText, data.runtime ? `${data.runtime} min` : '', data.vote_average ? `★ ${Number(data.vote_average).toFixed(1)}` : ''].filter(Boolean);
  if (!isFilm && episode?.air_date) {
    const dt = new Date(`${episode.air_date}T12:00:00`);
    if (!Number.isNaN(dt.getTime())) meta.push(new Intl.DateTimeFormat('pt-BR').format(dt));
  }
  $('#watch-meta').innerHTML = meta.map(value => `<span>${escapeHtml(value)}</span>`).join('');
  $('#watch-overview').textContent = isFilm ? data.overview || 'Sinopse indisponível.' : episode?.overview || data.overview || 'Sinopse indisponível.';
  $('#watch-genres').textContent = (data.genres || []).map(genre => typeof genre === 'string' ? genre : genre.name).filter(Boolean).join(' · ');
  renderCastButtons($('#watch-cast-wrap'), $('#watch-cast'), data.cast || []);
  renderSimilarSection($('#watch-similar-section'), $('#watch-similar-grid'), data.similar || []);
  const trailerBtn = $('#watch-trailer-btn');
  if (trailerBtn) {
    trailerBtn.hidden = !data.trailerKey;
    trailerBtn.dataset.trailerKey = data.trailerKey || '';
    trailerBtn.dataset.trailerTitle = itemTitle;
  }
  syncFavoriteButtonsState();
  const backdrop = imageOf({ backdrop_path: data.backdrop_path, poster_path: data.poster_path, poster: data.poster });
  $('#watch-info').style.backgroundImage = backdrop ? `linear-gradient(90deg,#111015 0%,rgba(17,16,21,.94) 70%,rgba(17,16,21,.85)),url("${escapeHtml(backdrop)}")` : '';
  if (!isFilm) {
    $('#watch-episode-label').textContent = `Temporada ${watch.season} · Episódio ${watch.episode}${episode?.name ? ` — ${episode.name}` : ''}`;
    const seasons = (watch.data?.seasons || []).filter(entry => Number(entry.season_number) > 0).sort((a, b) => a.season_number - b.season_number);
    const index = seasons.findIndex(entry => Number(entry.season_number) === watch.season);
    const season = seasons[index];
    $('#watch-previous').disabled = watch.episode <= 1 && index <= 0;
    $('#watch-next').disabled = !(season?.episode_count && watch.episode < season.episode_count) && !(index >= 0 && index < seasons.length - 1);
  }
}
function renderWatchEpisodes() {
  const watch = state.watch;
  const data = watch.data;
  const episodes = [...(data?.episodes || [])].sort((a, b) => Number(a.episode_number) - Number(b.episode_number));
  const jump = $('#watch-episode-jump');
  jump.innerHTML = episodes.map(entry => `<option value="${Number(entry.episode_number)}">${Number(entry.episode_number)}. ${escapeHtml(entry.name)}</option>`).join('');
  if (episodes.some(entry => Number(entry.episode_number) === watch.episode)) jump.value = String(watch.episode);
  const filterTerm = normalizeSearchStr(state.watchEpisodeFilter || $('#watch-episode-filter')?.value || '');
  const filteredEps = filterTerm
    ? episodes.filter(ep => normalizeSearchStr(`${ep.episode_number} ${ep.name || ''} ${ep.overview || ''}`).includes(filterTerm))
    : episodes;
  const ordered = $('#watch-episode-reverse').checked ? [...filteredEps].reverse() : filteredEps;
  const saved = findHistoryEntry(watch.kind, watch.id);
  $('#watch-episode-list').innerHTML = ordered.map(entry => {
    const epNum = Number(entry.episode_number);
    const still = episodeStill(entry.still_path);
    let date = 'Disponível';
    if (entry.air_date) {
      const dt = new Date(`${entry.air_date}T12:00:00`);
      if (!Number.isNaN(dt.getTime())) date = new Intl.DateTimeFormat('pt-BR').format(dt);
    }
    const isCurrent = epNum === watch.episode;
    const watched = !isCurrent && (epNum < watch.episode || isEpisodeWatched(saved, watch.season, epNum));
    const watchedBadge = watched ? ' <span class="episode-watched-badge">✓ Assistido</span>' : isCurrent ? ' <span class="episode-watched-badge in-progress">▶ Reproduzindo</span>' : '';
    return `<article class="episode-card${watched ? ' watched' : ''}${isCurrent ? ' current' : ''}">
      <div class="episode-still">${still ? `<img loading="lazy" src="${escapeHtml(still)}" alt="">` : '<span>▶</span>'}</div>
      <button class="episode-play" type="button" data-watch-episode="${epNum}" aria-label="Assistir episódio ${epNum}"><span aria-hidden="true">▶</span> Play</button>
      <div class="episode-card-copy"><p class="episode-number">EPISÓDIO ${epNum} · ${escapeHtml(date)}${watchedBadge}</p><h4>${escapeHtml(entry.name)}</h4><p class="episode-overview">${escapeHtml(entry.overview || 'Episódio disponível no catálogo.')}</p></div>
    </article>`;
  }).join('') || '<div class="empty-state">Nenhum episódio encontrado com esse filtro.</div>';
  $('#watch-episode-status').textContent = `${filteredEps.length} de ${episodes.length} ${episodes.length === 1 ? 'episódio' : 'episódios'}`;
}
async function loadWatchData(season = state.watch.season) {
  const watch = state.watch;
  if (!watch || watch.kind === 'filme') return;
  const reqId = (watch.loadReqId = (watch.loadReqId || 0) + 1);
  watch.loading = true;
  $('#watch-episode-status').textContent = 'Carregando episódios…';
  $('#watch-episode-list').innerHTML = '<div class="loading-state"><span class="spinner"></span>Carregando episódios…</div>';
  try {
    const data = await requestJson(`/api/series/${encodeURIComponent(watch.id)}?season=${encodeURIComponent(season)}&kind=${encodeURIComponent(watch.kind)}`);
    if (watch !== state.watch || reqId !== watch.loadReqId) return;
    watch.data = data;
    watch.season = Number(data.season) || season;
    const seasons = (data.seasons || []).filter(entry => Number(entry.season_number) > 0);
    $('#watch-season-select').innerHTML = seasons.map(entry => `<option value="${Number(entry.season_number)}">${escapeHtml(entry.name)}${entry.air_date ? ` (${escapeHtml(entry.air_date.slice(0, 4))})` : ''}</option>`).join('');
    $('#watch-season-select').value = String(watch.season);
    $('#watch-episodes-heading').textContent = seasons.find(entry => Number(entry.season_number) === watch.season)?.name || `Temporada ${watch.season}`;
    renderWatchInfo();
    renderWatchEpisodes();
  } catch (error) {
    $('#watch-episode-status').textContent = error.message;
    $('#watch-episode-list').innerHTML = '<div class="empty-state">Não foi possível carregar os episódios agora.</div>';
  } finally { watch.loading = false; }
}
async function navigateWatch(season, episode) {
  const watch = state.watch;
  if (!watch) return;
  const oldSeason = watch.season;
  watch.season = Math.max(1, Number(season) || 1);
  watch.episode = Math.max(1, Number(episode) || 1);
  updateWatchRoute();
  loadAndPlayTarget({
    kind: watch.kind,
    id: watch.id,
    season: watch.season,
    episode: watch.episode,
    target: 'watch',
    titleText: `Player de ${watch.kind}`,
  });
  if (oldSeason !== watch.season) await loadWatchData(watch.season);
  else {
    renderWatchInfo();
    renderWatchEpisodes();
  }
}
function stepWatchEpisode(direction) {
  const watch = state.watch;
  const seasons = (watch?.data?.seasons || []).filter(entry => Number(entry.season_number) > 0).sort((a, b) => a.season_number - b.season_number);
  const index = seasons.findIndex(entry => Number(entry.season_number) === watch?.season);
  const currentSeason = seasons[index];
  let season = watch.season;
  let episode = watch.episode + direction;
  if (episode < 1 && index > 0) {
    season = Number(seasons[index - 1].season_number);
    episode = Number(seasons[index - 1].episode_count) || 1;
  } else if (currentSeason?.episode_count && episode > currentSeason.episode_count && index >= 0 && index < seasons.length - 1) {
    season = Number(seasons[index + 1].season_number);
    episode = 1;
  }
  if (season !== watch.season || episode !== watch.episode) navigateWatch(season, episode);
}

function renderWatchChannelZapping(currentTitle = '') {
  const watch = state.watch;
  const zapBar = $('#watch-channel-zapping');
  if (!zapBar) return;
  if (!watch || watch.kind !== 'canais') {
    zapBar.hidden = true;
    return;
  }
  zapBar.hidden = false;
  const list = watch.channels || [];
  const idx = list.findIndex(ch => idOf(ch) === watch.id || (Array.isArray(ch.aliases) && ch.aliases.includes(watch.id)));
  const currentCh = idx >= 0 ? list[idx] : null;
  const label = $('#watch-zapping-label');
  if (label) {
    label.textContent = currentCh ? `${titleOf(currentCh)}${currentCh.category ? ` · ${currentCh.category}` : ''}` : (currentTitle || $('#watch-title')?.textContent || 'Canal ao Vivo');
  }
  const prevBtn = $('#watch-prev-channel');
  const nextBtn = $('#watch-next-channel');
  if (prevBtn) prevBtn.disabled = list.length < 2;
  if (nextBtn) nextBtn.disabled = list.length < 2;
  syncFavoriteButtonsState();
}

function stepWatchChannel(direction) {
  const watch = state.watch;
  if (!watch || watch.kind !== 'canais' || !Array.isArray(watch.channels) || watch.channels.length < 2) return;
  const list = watch.channels;
  let idx = list.findIndex(ch => idOf(ch) === watch.id || (Array.isArray(ch.aliases) && ch.aliases.includes(watch.id)));
  if (idx < 0) idx = 0;
  const nextIdx = (idx + direction + list.length) % list.length;
  const targetCh = list[nextIdx];
  if (targetCh) {
    switchWatchChannel(idOf(targetCh));
    showToast(`Sintonizando ${titleOf(targetCh)}…`);
  }
}

function renderWatchChannelsDirectory() {
  const watch = state.watch;
  const section = $('#watch-channels-directory');
  if (!section) return;
  if (!watch || watch.kind !== 'canais') {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  renderWatchChannelZapping();
  const catBar = $('#watch-channel-categories');
  if (catBar) {
    catBar.innerHTML = CHANNEL_CATEGORIES.map(cat => {
      const active = watch.channelCategory === cat.id;
      return `<button class="channel-category-btn${active ? ' active' : ''}" type="button" data-watch-channel-category="${escapeHtml(cat.id)}">${escapeHtml(cat.label)}</button>`;
    }).join('');
  }
  const listEl = $('#watch-channels-list');
  if (listEl) {
    listEl.innerHTML = watch.channels?.length
      ? buildChannelsDirectoryHtml(watch.channels, watch.id, watch.channelFilter, watch.channelCategory)
      : '<div class="loading-state"><span class="spinner"></span>Carregando lista completa de canais…</div>';
  }
}

async function switchWatchChannel(channelId) {
  const watch = state.watch;
  if (!watch || watch.kind !== 'canais' || !channelId) return;
  watch.id = channelId;
  history.pushState({}, '', `/assistir/canais/${encodeURIComponent(channelId)}`);
  renderWatchChannelsDirectory();
  loadAndPlayTarget({
    kind: 'canais',
    id: channelId,
    season: 1,
    episode: 1,
    target: 'watch',
    titleText: 'Canal ao vivo',
  });
}

async function initializeWatchPage() {
  const watch = state.watch;
  if (!watch) return;
  $('#app-shell').hidden = true;
  $('#watch-page').hidden = false;
  document.title = 'Assistir — DEEPFLIX';
  $('#watch-back-link').href = ROUTES[watch.kind] || '/filmes';
  $('#watch-episodes').hidden = !EPISODIC_KINDS.has(watch.kind);
  $('#watch-episode-nav').hidden = !EPISODIC_KINDS.has(watch.kind);
  if ($('#watch-channel-zapping')) $('#watch-channel-zapping').hidden = watch.kind !== 'canais';
  if ($('#watch-channels-directory')) $('#watch-channels-directory').hidden = watch.kind !== 'canais';
  if (window.isDeepflixTvMode && window.isDeepflixTvMode()) {
    toggleTheaterMode(true);
  }

  await initAuthAndHistory();
  if (!watch.explicitRouteEpisode && EPISODIC_KINDS.has(watch.kind)) {
    const saved = findHistoryEntry(watch.kind, watch.id);
    if (saved?.season && saved?.episode) {
      watch.season = Number(saved.season) || 1;
      watch.episode = Number(saved.episode) || 1;
      updateWatchRoute();
    }
  }

  loadAndPlayTarget({
    kind: watch.kind,
    id: watch.id,
    season: watch.season,
    episode: watch.episode,
    target: 'watch',
    titleText: `Player de ${watch.kind === 'filme' ? 'filme' : 'episódio'}`,
  });
  if (watch.kind === 'canais') {
    if ($('#watch-actions-row')) $('#watch-actions-row').hidden = true;
    $('#watch-title').textContent = 'Carregando canal…';
    $('#watch-overview').textContent = 'Transmissão ao vivo. Escolha um servidor acima ou troque de canal na lista abaixo.';
    renderWatchChannelsDirectory();
    try {
      const chResult = await getCatalog('canais', { limit: 1000, page: 1 });
      watch.channels = (chResult.items || []).map(item => normalizeItem(item, 'canais'));
      renderWatchChannelsDirectory();
    } catch {}
    return;
  }
  try {
    const endpoint = watch.kind === 'filme'
      ? `/api/movie/${encodeURIComponent(watch.id)}`
      : `/api/series/${encodeURIComponent(watch.id)}?season=${watch.season}&kind=${encodeURIComponent(watch.kind)}`;
    watch.data = await requestJson(endpoint);
    if (watch.kind !== 'filme') {
      watch.season = Number(watch.data.season) || watch.season;
      const seasons = (watch.data.seasons || []).filter(entry => Number(entry.season_number) > 0);
      $('#watch-season-select').innerHTML = seasons.map(entry => `<option value="${Number(entry.season_number)}">${escapeHtml(entry.name)}${entry.air_date ? ` (${escapeHtml(entry.air_date.slice(0, 4))})` : ''}</option>`).join('');
      $('#watch-season-select').value = String(watch.season);
      $('#watch-episodes-heading').textContent = seasons.find(entry => Number(entry.season_number) === watch.season)?.name || `Temporada ${watch.season}`;
      renderWatchEpisodes();
    }
    renderWatchInfo();
  } catch (error) {
    $('#watch-title').textContent = `Título ${watch.id}`;
    $('#watch-overview').textContent = `O player abriu, mas as informações não puderam ser carregadas. ${error.message}`;
  }
}

async function reloadCurrentPage() {
  if (state.kind === 'all' && state.searchFilters) return runSearch(state.searchFilters);
  if (state.kind === 'platform') return;
  await fetchPage(state.kind);
}

// --- Mobile Drawer & Navigation ---
function openMobileDrawer() {
  const sidebar = $('#main-sidebar');
  const backdrop = $('#mobile-drawer-backdrop');
  const toggleBtn = $('#mobile-menu-toggle');
  if (!sidebar) return;
  sidebar.classList.add('drawer-open');
  if (backdrop) backdrop.hidden = false;
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('drawer-scroll-lock');
}

function closeMobileDrawer() {
  const sidebar = $('#main-sidebar');
  const backdrop = $('#mobile-drawer-backdrop');
  const toggleBtn = $('#mobile-menu-toggle');
  if (!sidebar) return;
  sidebar.classList.remove('drawer-open');
  if (backdrop) backdrop.hidden = true;
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('drawer-scroll-lock');
}

// Restore desktop sidebar collapsed state
if (localStorage.getItem('deepflix_sidebar_collapsed') === '1' && window.innerWidth > 960) {
  document.body.classList.add('sidebar-collapsed');
}

// --- Trailer Dialog ---
function openTrailer(trailerKey, title = 'Trailer oficial') {
  if (!trailerKey) return showToast('Trailer indisponível para este título.');
  const dialog = $('#trailer-dialog');
  const wrap = $('#trailer-frame-wrap');
  const titleEl = $('#trailer-title');
  if (titleEl) titleEl.textContent = title;
  if (wrap) {
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailerKey)}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
  }
  if (dialog && !dialog.open) dialog.showModal();
}

function closeTrailer() {
  const dialog = $('#trailer-dialog');
  const wrap = $('#trailer-frame-wrap');
  if (wrap) wrap.replaceChildren();
  if (dialog?.open) dialog.close();
}

// --- Search Autocomplete ---
let searchSuggestTimer = null;
async function fetchSearchSuggestions(query, targetContainerId) {
  const container = $(targetContainerId);
  if (!container) return;
  const term = (query || '').trim();
  if (term.length < 2) {
    container.innerHTML = '';
    container.hidden = true;
    return;
  }
  try {
    const data = await getCatalog('all', { query: term, limit: 6, page: 1 });
    const items = data.items || [];
    if (!items.length) {
      container.innerHTML = '<div class="search-suggest-empty">Nenhum título encontrado</div>';
      container.hidden = false;
      return;
    }
    container.innerHTML = items.map(item => {
      const norm = normalizeItem(item);
      const title = titleOf(norm);
      const poster = imageOf(norm);
      const rawDate = norm.release_date || norm.first_air_date || norm.date || '';
      const year = rawDate ? String(rawDate).slice(0, 4) : '';
      const kindLabel = KIND_LABELS[norm.__kind || norm.kind] || 'Título';
      return `<div class="search-suggest-item" role="button" tabindex="0" data-suggest-kind="${escapeHtml(norm.__kind || norm.kind || 'filme')}" data-suggest-id="${escapeHtml(idOf(norm))}">
        <div class="search-suggest-poster">${poster ? `<img src="${escapeHtml(poster)}" alt="" loading="lazy">` : '<span>🎬</span>'}</div>
        <div class="search-suggest-info">
          <div class="search-suggest-title">${escapeHtml(title)}</div>
          <div class="search-suggest-meta">${escapeHtml(kindLabel)}${year ? ` · ${escapeHtml(year)}` : ''}</div>
        </div>
      </div>`;
    }).join('');
    container.hidden = false;
  } catch {
    container.hidden = true;
  }
}

function updateFavoritesBadge() {
  renderAuthUI();
}

function setupSearchAutocomplete(inputId, containerId) {
  const input = $(inputId);
  const container = $(containerId);
  if (!input || !container) return;
  input.addEventListener('input', () => {
    clearTimeout(searchSuggestTimer);
    searchSuggestTimer = setTimeout(() => {
      fetchSearchSuggestions(input.value, containerId);
    }, 250);
  });
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && container.children.length) {
      container.hidden = false;
    }
  });
  const handleSelectSuggest = targetEl => {
    const itemEl = targetEl.closest('[data-suggest-id]');
    if (!itemEl) return;
    const kind = itemEl.dataset.suggestKind;
    const id = itemEl.dataset.suggestId;
    container.hidden = true;
    if (MEDIA_KINDS.has(kind)) {
      openDetails({ id, title: id }, kind);
    } else if (kind === 'canais') {
      window.location.assign(`/assistir/canais/${encodeURIComponent(id)}`);
    } else {
      window.location.assign(`/assistir/${kind}/${encodeURIComponent(id)}`);
    }
  };
  container.addEventListener('click', event => handleSelectSuggest(event.target));
  container.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSelectSuggest(event.target);
    }
  });
}

// --- Event Listeners ---
$('#mobile-menu-toggle')?.addEventListener('click', () => {
  if (window.innerWidth > 960) {
    document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem('deepflix_sidebar_collapsed', document.body.classList.contains('sidebar-collapsed') ? '1' : '0');
  } else {
    const isOpen = $('#main-sidebar')?.classList.contains('drawer-open');
    if (isOpen) closeMobileDrawer();
    else openMobileDrawer();
  }
});
$('#mobile-drawer-close')?.addEventListener('click', closeMobileDrawer);
$('#mobile-drawer-backdrop')?.addEventListener('click', closeMobileDrawer);
$('#main-sidebar')?.addEventListener('click', event => {
  if (event.target.closest('a.nav-link')) closeMobileDrawer();
});
$('#sidebar-account-btn')?.addEventListener('click', () => {
  closeMobileDrawer();
  openAuthModal('login');
});
$('#topbar-auth-btn')?.addEventListener('click', () => openAuthModal('login'));
$('#mobile-bottom-account-btn')?.addEventListener('click', () => openAuthModal('login'));
$('#close-auth')?.addEventListener('click', () => $('#auth-dialog').close());
$('#auth-dialog')?.addEventListener('click', event => { if (event.target === $('#auth-dialog')) $('#auth-dialog').close(); });
$('#auth-tab-login')?.addEventListener('click', () => setAuthTab('login'));
$('#auth-tab-register')?.addEventListener('click', () => setAuthTab('register'));
$('#auth-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const errEl = $('#auth-error');
  const submitBtn = $('#auth-submit-btn');
  errEl.hidden = true;
  submitBtn.disabled = true;
  try {
    const isReg = state.authMode === 'register';
    const endpoint = isReg ? '/api/auth/register' : '/api/auth/login';
    const payload = {
      name: $('#auth-name-input').value.trim(),
      username: $('#auth-username-input').value.trim(),
      password: $('#auth-password-input').value,
    };
    const res = await requestJson(endpoint, { method: 'POST', body: payload });
    state.user = res.user;
    const cloudHist = (Array.isArray(res.history) ? res.history : []).filter(h => h.kind !== 'canais');
    const cloudFavs = Array.isArray(res.favorites) ? res.favorites : [];
    state.history = mergeByKey(cloudHist, state.history);
    state.favorites = mergeByKey(cloudFavs, state.favorites);
    saveLocalHistory(state.history);
    saveLocalFavorites(state.favorites);
    // Envia os favoritos locais que ainda não existiam na nuvem
    for (const f of state.favorites) {
      if (!cloudFavs.some(cf => cf.key === f.key)) {
        requestJson('/api/favorites', { method: 'POST', body: f }).catch(() => {});
      }
    }
    $('#auth-form').reset();
    $('#auth-dialog').close();
    renderAuthUI();
    if (state.kind === 'historico' || state.kind === 'favoritos') render();
    showToast(isReg ? `Conta criada! Bem-vindo(a), ${state.user.name}.` : `Bem-vindo(a) de volta, ${state.user.name}!`);
  } catch (err) {
    errEl.textContent = err.message || 'Não foi possível autenticar.';
    errEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});
$('#auth-logout-btn')?.addEventListener('click', async () => {
  try {
    await requestJson('/api/auth/logout', { method: 'POST' });
  } catch {}
  state.user = null;
  // Mantém histórico e favoritos salvos no aparelho conforme decisão de persistência local
  $('#auth-dialog').close();
  renderAuthUI();
  if (state.kind === 'historico' || state.kind === 'favoritos') render();
  showToast('Você saiu da sua conta. Seus dados continuam salvos neste aparelho.');
});
$('#clear-all-history')?.addEventListener('click', () => {
  if (window.confirm('Tem certeza que deseja limpar todo o seu histórico de reprodução?')) {
    clearAllHistory();
  }
});

$('#clear-all-favorites')?.addEventListener('click', () => {
  if (window.confirm('Tem certeza que deseja remover todos os itens da sua lista de favoritos?')) {
    clearAllFavorites();
  }
});

$('#global-search-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const qVal = ($('#global-search-input')?.value || '').trim();
  const mode = $('#global-search-mode')?.value || 'title';
  const suggestEl = $('#global-search-suggest');
  if (suggestEl) suggestEl.hidden = true;
  if (!qVal) return;
  if (state.kind === 'all' && !watchRouteMatch) {
    state.page = 1;
    if (mode === 'actor') {
      if ($('#main-search-mode')) $('#main-search-mode').value = 'actor';
      if ($('#actor-filter')) $('#actor-filter').value = qVal;
      if ($('#search-input')) $('#search-input').value = '';
      runSearch({ query: '', actor: qVal, kind: '', platform: '', genre: '', year: '', sort: 'recent' });
    } else {
      if ($('#main-search-mode')) $('#main-search-mode').value = 'title';
      if ($('#actor-filter')) $('#actor-filter').value = '';
      if ($('#search-input')) $('#search-input').value = qVal;
      runSearch({ query: qVal, actor: '', kind: '', platform: '', genre: '', year: '', sort: 'recent' });
    }
    return;
  }
  const paramName = mode === 'actor' ? 'ator' : 'q';
  window.location.assign(`/?${paramName}=${encodeURIComponent(qVal)}`);
});

$('#search-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const suggestEl = $('#main-search-suggest');
  if (suggestEl) suggestEl.hidden = true;
  state.page = 1;
  runSearch();
});

$('#channel-filter-input')?.addEventListener('input', event => {
  state.channelFilter = event.target.value || '';
  if (state.kind === 'canais') render();
});
$('#watch-channel-filter')?.addEventListener('input', event => {
  if (!state.watch) return;
  state.watch.channelFilter = event.target.value || '';
  renderWatchChannelsDirectory();
});
$('#sitemap-search-form')?.addEventListener('submit', event => {
  event.preventDefault();
  state.mapa.query = ($('#sitemap-search-input')?.value || '').trim();
  state.mapa.page = 1;
  fetchSitemapPage();
});

// Category genre, sort & year dropdowns
$('#category-genre-select')?.addEventListener('change', event => {
  const genreId = event.target.value;
  state.genre = genreId;
  state.page = 1;
  const path = ROUTES[state.kind] + (genreId ? `?genero=${encodeURIComponent(genreId)}` : '');
  window.history.pushState({}, '', path);
  applyRoute(window.location.pathname + window.location.search);
});
$('#channels-category-select')?.addEventListener('change', event => {
  state.channelCategory = event.target.value;
  state.page = 1;
  renderCatalog();
});
$('#category-sort-select')?.addEventListener('change', event => {
  state.categorySort = event.target.value;
  state.sort = event.target.value;
  state.page = 1;
  reloadCurrentPage();
});
$('#category-year-select')?.addEventListener('change', event => {
  state.categoryYear = event.target.value;
  state.page = 1;
  reloadCurrentPage();
});

// Platform carousel navigation (‹ and › buttons)
document.addEventListener('click', event => {
  const prevBtn = event.target.closest('[data-carousel-prev]');
  if (prevBtn) {
    const kind = prevBtn.dataset.carouselPrev;
    const grid = document.querySelector(`[data-section-grid="${kind}"]`);
    if (grid) grid.scrollBy({ left: -Math.max(260, grid.clientWidth * 0.75), behavior: 'smooth' });
    return;
  }
  const nextBtn = event.target.closest('[data-carousel-next]');
  if (nextBtn) {
    const kind = nextBtn.dataset.carouselNext;
    const grid = document.querySelector(`[data-section-grid="${kind}"]`);
    if (grid) grid.scrollBy({ left: Math.max(260, grid.clientWidth * 0.75), behavior: 'smooth' });
    return;
  }
});

// Episode filter searches
$('#episode-filter')?.addEventListener('input', event => {
  state.episodeFilter = event.target.value || '';
  renderEpisodes();
});
$('#watch-episode-filter')?.addEventListener('input', event => {
  state.watchEpisodeFilter = event.target.value || '';
  renderWatchEpisodes();
});

// Mobile search filter toggle
$('#toggle-search-filters')?.addEventListener('click', () => {
  const form = $('#search-form');
  if (form) form.classList.toggle('filters-collapsed');
});

// Trailer buttons & close
$('#detail-trailer-btn')?.addEventListener('click', () => {
  const btn = $('#detail-trailer-btn');
  if (btn?.dataset.trailerKey) openTrailer(btn.dataset.trailerKey, btn.dataset.trailerTitle || 'Trailer oficial');
});
$('#watch-trailer-btn')?.addEventListener('click', () => {
  const btn = $('#watch-trailer-btn');
  if (btn?.dataset.trailerKey) openTrailer(btn.dataset.trailerKey, btn.dataset.trailerTitle || 'Trailer oficial');
});
$('#close-trailer')?.addEventListener('click', closeTrailer);
$('#trailer-dialog')?.addEventListener('click', event => {
  if (event.target === $('#trailer-dialog')) closeTrailer();
});

// Detail & Watch Favorites action buttons
$('#detail-fav-btn')?.addEventListener('click', () => {
  if (!state.selected) return;
  toggleFavoriteItem(state.selected.item, state.selected.kind);
});
$('#watch-fav-btn')?.addEventListener('click', () => {
  if (!state.watch) return;
  const d = state.watch.data?.details || {};
  const item = {
    id: state.watch.id,
    title: d.title || state.watch.data?.name || `Título ${state.watch.id}`,
    poster_path: d.poster_path,
    backdrop_path: d.backdrop_path,
    release_date: d.release_date,
    first_air_date: d.first_air_date,
    vote_average: d.vote_average,
  };
  toggleFavoriteItem(item, state.watch.kind);
});
$('#watch-channel-fav-btn')?.addEventListener('click', () => {
  if (!state.watch || state.watch.kind !== 'canais') return;
  const list = state.watch.channels || [];
  const currentCh = list.find(ch => idOf(ch) === state.watch.id || (Array.isArray(ch.aliases) && ch.aliases.includes(state.watch.id)));
  const item = currentCh || { id: state.watch.id, title: $('#watch-title')?.textContent || 'Canal ao vivo' };
  toggleFavoriteItem(item, 'canais');
});

// Channel zapping buttons
$('#watch-prev-channel')?.addEventListener('click', () => stepWatchChannel(-1));
$('#watch-next-channel')?.addEventListener('click', () => stepWatchChannel(1));

// Back to top button
const backToTopBtn = $('#back-to-top');
window.addEventListener('scroll', () => {
  if (backToTopBtn) {
    if (window.scrollY > 350) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
  }
}, { passive: true });
backToTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Setup autocompletes
setupSearchAutocomplete('#global-search-input', '#global-search-suggest');
setupSearchAutocomplete('#search-input', '#main-search-suggest');

document.addEventListener('click', event => {
  // Hide autocompletes when clicking outside
  if (!event.target.closest('#global-search-form') && !event.target.closest('#global-search-suggest')) {
    const s = $('#global-search-suggest');
    if (s) s.hidden = true;
  }
  if (!event.target.closest('#search-form') && !event.target.closest('#main-search-suggest')) {
    const s = $('#main-search-suggest');
    if (s) s.hidden = true;
  }

  // Favorite toggle star on movie cards
  const favToggleBtn = event.target.closest('[data-fav-toggle]');
  if (favToggleBtn) {
    event.preventDefault();
    event.stopPropagation();
    const rawToggle = favToggleBtn.dataset.favToggle || '';
    const colonIdx = rawToggle.indexOf(':');
    const kind = favToggleBtn.dataset.favKind || (colonIdx >= 0 ? rawToggle.slice(0, colonIdx) : state.kind);
    const id = favToggleBtn.dataset.favId || (colonIdx >= 0 ? rawToggle.slice(colonIdx + 1) : rawToggle);
    const pool = [...displayItems(), ...state.favorites, ...state.history.map(h => ({ ...h, id: h.itemId, __kind: h.kind }))];
    const found = pool.find(entry => idOf(entry) === id && (entry.__kind || entry.kind || state.kind) === kind);
    const item = found || { id, title: id, __kind: kind };
    toggleFavoriteItem(item, kind);
    return;
  }

  // Favorite toggle star on channels list
  const favChanBtn = event.target.closest('[data-fav-channel]');
  if (favChanBtn) {
    event.preventDefault();
    event.stopPropagation();
    const chId = favChanBtn.dataset.favChannel;
    const chTitle = favChanBtn.dataset.favTitle || chId;
    const chCat = favChanBtn.dataset.favCategory || '';
    toggleFavoriteItem({ id: chId, title: chTitle, name: chTitle, category: chCat }, 'canais');
    return;
  }

  // Favorites category filter
  const favCatBtn = event.target.closest('[data-favorites-category]');
  if (favCatBtn && state.kind === 'favoritos') {
    state.favoritesCategory = favCatBtn.dataset.favoritesCategory || '';
    state.page = 1;
    render();
    return;
  }

  const mapaSortBtn = event.target.closest('[data-mapa-sort]');
  if (mapaSortBtn && state.kind === 'mapa') {
    const newSort = mapaSortBtn.dataset.mapaSort || 'az';
    state.mapa.sort = newSort;
    if (newSort === 'year_desc' || newSort === 'year_asc') state.mapa.letter = '';
    else state.mapa.year = '';
    state.mapa.page = 1;
    fetchSitemapPage();
    return;
  }
  const mapaKindBtn = event.target.closest('[data-mapa-kind]');
  if (mapaKindBtn && state.kind === 'mapa') {
    state.mapa.kind = mapaKindBtn.dataset.mapaKind || 'all';
    state.mapa.page = 1;
    fetchSitemapPage();
    return;
  }
  const mapaLetterBtn = event.target.closest('[data-mapa-letter]');
  if (mapaLetterBtn && state.kind === 'mapa') {
    state.mapa.letter = mapaLetterBtn.dataset.mapaLetter || '';
    state.mapa.page = 1;
    fetchSitemapPage();
    return;
  }
  const mapaYearBtn = event.target.closest('[data-mapa-year]');
  if (mapaYearBtn && state.kind === 'mapa') {
    state.mapa.year = mapaYearBtn.dataset.mapaYear || '';
    state.mapa.page = 1;
    fetchSitemapPage();
    return;
  }
  const pageButton = event.target.closest('[data-page-main], [data-page-section], [data-page-mapa]');
  if (pageButton) {
    const page = Number(pageButton.dataset.page);
    if (pageButton.hasAttribute('data-page-mapa')) {
      state.mapa.page = page;
      fetchSitemapPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (pageButton.hasAttribute('data-page-section')) {
      const kind = pageButton.dataset.pageSection;
      state.platformSections[kind].page = page;
      loadPlatformSection(kind);
      const targetEl = document.querySelector(`[data-section-kind="${kind}"]`);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      state.page = page;
      if (state.kind === 'historico') render(); else reloadCurrentPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }
  const removeHistBtn = event.target.closest('[data-remove-history]');
  if (removeHistBtn) {
    event.preventDefault();
    event.stopPropagation();
    removeHistoryItem(removeHistBtn.dataset.removeHistory);
    return;
  }
  const categoryBtn = event.target.closest('[data-channel-category]');
  if (categoryBtn && state.kind === 'canais') {
    state.channelCategory = categoryBtn.dataset.channelCategory || '';
    state.page = 1;
    render();
    return;
  }
  const watchCatBtn = event.target.closest('[data-watch-channel-category]');
  if (watchCatBtn && state.watch?.kind === 'canais') {
    state.watch.channelCategory = watchCatBtn.dataset.watchChannelCategory || '';
    renderWatchChannelsDirectory();
    return;
  }
  const channelSwitchLink = event.target.closest('[data-channel-switch]');
  if (channelSwitchLink && state.watch?.kind === 'canais') {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      const targetId = channelSwitchLink.dataset.channelSwitch;
      if (targetId) {
        switchWatchChannel(targetId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
  }
  const actorLink = event.target.closest('[data-actor-link]');
  if (actorLink) {
    const actorName = actorLink.dataset.actorLink || '';
    if (actorName && state.kind === 'all' && !watchRouteMatch && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      $('#detail-dialog')?.close();
      state.page = 1;
      if ($('#actor-filter')) $('#actor-filter').value = actorName;
      if ($('#search-input')) $('#search-input').value = '';
      runSearch({ query: '', actor: actorName, kind: '', platform: '', genre: '', year: '', sort: 'recent' });
      return;
    }
  }
  const histCatBtn = event.target.closest('[data-history-category]');
  if (histCatBtn && state.kind === 'historico') {
    state.historyCategory = histCatBtn.dataset.historyCategory || '';
    state.page = 1;
    render();
    return;
  }
  const episodeButton = event.target.closest('[data-watch-episode]');
  if (episodeButton && state.watch) {
    navigateWatch(state.watch.season, Number(episodeButton.dataset.watchEpisode) || 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (episodeButton && state.selected) {
    openMediaPlayer(state.selected.item, state.selected.kind, Number($('#season-select').value) || 1, Number(episodeButton.dataset.watchEpisode) || 1);
    return;
  }
  const cardElement = event.target.closest('.movie-card');
  if (cardElement) {
    const kind = cardElement.dataset.kind;
    const id = cardElement.dataset.id;
    const seasonAttr = Number(cardElement.dataset.season) || null;
    const epAttr = Number(cardElement.dataset.episode) || null;
    const pool = [...displayItems(), ...state.history.map(h => ({ ...h, id: h.itemId, __kind: h.kind }))];
    const item = pool.find(entry => idOf(entry) === id && (entry.__kind || entry.kind || state.kind) === kind) || { id, title: id, __kind: kind };
    openDetails(item, kind, seasonAttr, epAttr);
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const gSuggest = $('#global-search-suggest');
    const mSuggest = $('#main-search-suggest');
    if (gSuggest && !gSuggest.hidden) gSuggest.hidden = true;
    if (mSuggest && !mSuggest.hidden) mSuggest.hidden = true;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      document.activeElement.blur();
      return;
    }
    closeMobileDrawer();
    closeTrailer();
    if ($('#player-dialog')?.open) {
      destroyHls('modal');
      $('#player-frame-wrap')?.replaceChildren();
      $('#player-dialog').close();
      state.playback = null;
    }
    return;
  }

  // Não intercepta comandos do navegador (Ctrl+T, Ctrl+F, Alt+Tab, etc.)
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if (isInput) return;

  if (event.key === '/') {
    event.preventDefault();
    $('#global-search-input')?.focus();
    return;
  }

  const activeVideo = document.querySelector('.player-frame-wrap video') || document.querySelector('video');

  if (event.key === ' ' || event.code === 'Space') {
    if (event.target && event.target.closest('button, a, input, textarea, select')) return;
    if (activeVideo) {
      event.preventDefault();
      if (activeVideo.paused) safePlayVideo(activeVideo);
      else activeVideo.pause();
    }
  } else if (event.key === 'ArrowLeft') {
    if (activeVideo && !(window.isDeepflixTvMode && window.isDeepflixTvMode())) {
      event.preventDefault();
      activeVideo.currentTime = Math.max(0, activeVideo.currentTime - 10);
      showToast('⏪ -10s');
    }
  } else if (event.key === 'ArrowRight') {
    if (activeVideo && !(window.isDeepflixTvMode && window.isDeepflixTvMode())) {
      event.preventDefault();
      activeVideo.currentTime = Math.min(activeVideo.duration || Infinity, activeVideo.currentTime + 10);
      showToast('⏩ +10s');
    }
  } else if (event.key === 'f' || event.key === 'F') {
    event.preventDefault();
    togglePlayerFullscreen(state.watch ? 'watch' : 'player');
  } else if (event.key === 'm' || event.key === 'M') {
    if (activeVideo) {
      event.preventDefault();
      activeVideo.muted = !activeVideo.muted;
      showToast(activeVideo.muted ? '🔇 Mudo' : '🔊 Áudio ativado');
    }
  } else if (event.key === 't' || event.key === 'T') {
    if (state.watch) {
      event.preventDefault();
      toggleTheaterMode();
    }
  }
});
$('#clear-filters')?.addEventListener('click', () => {
  $('#search-form')?.reset();
  if ($('#actor-filter')) $('#actor-filter').value = '';
  if ($('#main-search-mode')) $('#main-search-mode').value = 'title';
  if ($('#global-search-mode')) $('#global-search-mode').value = 'title';
  if ($('#kind-filter')) $('#kind-filter').value = '';
  if ($('#platform-filter')) $('#platform-filter').value = '';
  if ($('#genre-filter')) $('#genre-filter').value = '';
  if ($('#year-filter')) $('#year-filter').value = '';
  if ($('#sort-filter')) $('#sort-filter').value = 'recent';
  state.searchItems = null;
  state.searchActorInfo = null;
  state.searchFilters = null;
  state.canLoadMore = false;
  state.page = 1;
  if ($('#api-notice')) $('#api-notice').hidden = true;
  render();
  if (grid) grid.innerHTML = '<div class="empty-state">Escolha os filtros e clique em Buscar para consultar o catálogo.</div>';
  if ($('#result-count')) $('#result-count').textContent = '';
});
$('#detail-play')?.addEventListener('click', () => {
  if (!state.selected) return;
  const { item, kind } = state.selected;
  if (MEDIA_KINDS.has(kind)) openMediaPlayer(item, kind, Number($('#season-select')?.value) || 1, selectedEpisode());
  else if (kind === 'canais') openChannelPlayer(item);
});
$('#season-select')?.addEventListener('change', () => {
  if (state.selected && EPISODIC_KINDS.has(state.selected.kind)) loadEpisodes(state.selected.item, Number($('#season-select')?.value) || 1);
});
$('#episode-jump')?.addEventListener('change', () => {
  if (state.episodeData && $('#detail-play')) $('#detail-play').innerHTML = `Assistir T${state.episodeData.season}:E${selectedEpisode()} <span aria-hidden="true">▶</span>`;
});
$('#episode-reverse')?.addEventListener('change', renderEpisodes);
$('#watch-previous')?.addEventListener('click', () => stepWatchEpisode(-1));
$('#watch-next')?.addEventListener('click', () => stepWatchEpisode(1));
$('#watch-show-list')?.addEventListener('click', () => $('#watch-episodes')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
$('#watch-season-select')?.addEventListener('change', () => navigateWatch(Number($('#watch-season-select')?.value), 1));
$('#watch-episode-jump')?.addEventListener('change', () => navigateWatch(state.watch?.season, Number($('#watch-episode-jump')?.value)));
$('#watch-episode-reverse')?.addEventListener('change', renderWatchEpisodes);
$('#close-detail')?.addEventListener('click', () => $('#detail-dialog')?.close());
$('#detail-dialog')?.addEventListener('click', event => { if (event.target === $('#detail-dialog')) $('#detail-dialog')?.close(); });
$('#previous-episode')?.addEventListener('click', () => stepEpisode(-1));
$('#next-episode')?.addEventListener('click', () => stepEpisode(1));
$('#show-episode-list')?.addEventListener('click', () => {
  if (!state.playback) return;
  const playback = state.playback;
  destroyHls('modal');
  $('#player-dialog')?.close();
  $('#player-frame-wrap')?.replaceChildren();
  openDetails(playback.item, playback.kind, playback.season, playback.episode);
});
$('#close-player')?.addEventListener('click', () => {
  destroyHls('modal');
  $('#player-dialog')?.close();
  $('#player-frame-wrap')?.replaceChildren();
  state.playback = null;
});
$('#player-dialog')?.addEventListener('click', event => {
  if (event.target === $('#player-dialog')) {
    destroyHls('modal');
    $('#player-dialog')?.close();
    $('#player-frame-wrap')?.replaceChildren();
    state.playback = null;
  }
});
for (let year = new Date().getFullYear(); year >= 1950; year--) $('#year-filter')?.insertAdjacentHTML('beforeend', `<option value="${year}">${year}</option>`);

// Alternador dinâmico de estilo do logotipo (Bicolor padrão vs Neon)
window.setBrandLogoVariant = function(variant) {
  const file = variant === 'neon' ? '/logo-neon.svg' : '/logo.svg';
  document.querySelectorAll('.brand-logo-img').forEach(img => {
    img.src = file;
  });
  try { localStorage.setItem('deepflix_logo_variant', variant); } catch {}
  return `Logotipo alterado para: ${variant}`;
};
try {
  const savedLogo = localStorage.getItem('deepflix_logo_variant');
  if (savedLogo === 'neon') window.setBrandLogoVariant('neon');
  else if (savedLogo === 'bicolor') window.setBrandLogoVariant('bicolor');
} catch {}

// Registro do Service Worker PWA para instalação nativa
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
if (watchRouteMatch) {
  initializeWatchPage();
} else {
  render();
  initAuthAndHistory().then(() => {
    if (initialActorQuery) {
      if ($('#global-search-mode')) $('#global-search-mode').value = 'actor';
      if ($('#main-search-mode')) $('#main-search-mode').value = 'actor';
      if ($('#global-search-input')) $('#global-search-input').value = initialActorQuery;
      if ($('#actor-filter')) $('#actor-filter').value = initialActorQuery;
      runSearch({ query: '', actor: initialActorQuery, kind: '', platform: '', genre: '', year: '', sort: 'recent' });
    } else if (initialSearchQuery) {
      $('#global-search-input').value = initialSearchQuery;
      $('#search-input').value = initialSearchQuery;
      runSearch({ query: initialSearchQuery, actor: '', kind: '', platform: '', genre: '', year: '', sort: 'recent' });
    } else {
      fetchPage(state.kind);
    }
  });
}
