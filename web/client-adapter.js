// Client-Side Gist Scraper e Normalizador para rodar 100% no Cloudflare Pages sem servidor Node
const GIST_URLS = {
  filme: 'https://gist.githubusercontent.com/skyrisk/5b87797329c7b46422565ffbaab3be7e/raw/page.xml',
  serie: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/SeriesBase',
  anime: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/AnimesBase',
  dorama: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DoramasBase',
  desenho: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DesenhosBase',
  novela: 'https://gist.githubusercontent.com/skyrisk/07f1f4cd1b203cbf2efec959c4e8645a/raw/novelas.xml',
  canais: 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/724314f19365a9b0d37511b82e4ec72c89d639a3/channels.xml',
};

const _clientCache = new Map();

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

window.fetchGistDirect = async function(category) {
  if (_clientCache.has(category)) return _clientCache.get(category);
  const url = GIST_URLS[category];
  if (!url) return [];

  try {
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) return [];
    const rawText = await res.text();
    // Sanitiza '&' soltos no XML para não quebrar o DOMParser (muito comum em canais como FILMES & SÉRIES)
    const sanitizedXml = rawText.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/gi, '&amp;');
    const parser = new DOMParser();
    const xml = parser.parseFromString(sanitizedXml, 'text/xml');
    const tagName = category === 'filme' ? 'item' : 'channel';
    const elements = xml.querySelectorAll(tagName);
    const items = [];

    elements.forEach((el, idx) => {
      const rawTitle = el.querySelector('title')?.textContent?.trim() || el.querySelector('name')?.textContent?.trim() || '';
      const title = cleanTitleText(rawTitle);

      // Ignora lixos de lista IPTV, como itens de próxima página ou canais adultos
      if (!title || /PR[OÓ]XIMA\s*P[AÁ]GINA|P[AÁ]GINA\s*\d+|CANAIS\s*\+18|ADULTO/i.test(title)) {
        return;
      }

      const thumb = el.querySelector('thumbnail')?.textContent?.trim() || el.querySelector('poster')?.textContent?.trim() || el.querySelector('logo')?.textContent?.trim() || '';
      const desc = cleanTitleText(el.querySelector('description')?.textContent?.trim() || '');
      const link = el.querySelector('link')?.textContent?.trim() || 
                   el.querySelector('stream_url')?.textContent?.trim() || 
                   el.querySelector('externallink')?.textContent?.trim() || '';
      const cat = el.querySelector('category')?.textContent?.trim() || (category === 'canais' ? 'Geral' : category);

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
  const found = items.find(it => it.id === id) || items[0];

  if (!found || !found.streamUrl) {
    return { options: [] };
  }

  return {
    title: found.title,
    category: found.category,
    poster: found.poster_path,
    options: [
      {
        server: 'Principal',
        label: 'Principal (Direto)',
        url: found.streamUrl,
        type: found.streamUrl.includes('.m3u8') ? 'hls' : 'mp4',
        audio: 'Original',
      }
    ]
  };
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
