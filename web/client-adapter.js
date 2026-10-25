// Client-Side Gist Scraper para rodar 100% no Cloudflare Pages sem servidor Node
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

window.fetchGistDirect = async function(category) {
  if (_clientCache.has(category)) return _clientCache.get(category);
  const url = GIST_URLS[category];
  if (!url) return [];

  try {
    const res = await fetch(`${url}?t=${Date.now()}`);
    if (!res.ok) return [];
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const tagName = category === 'filme' ? 'item' : 'channel';
    const elements = xml.querySelectorAll(tagName);
    const items = [];

    elements.forEach((el, idx) => {
      const title = el.querySelector('title')?.textContent?.trim() || el.querySelector('name')?.textContent?.trim() || '';
      const thumb = el.querySelector('thumbnail')?.textContent?.trim() || el.querySelector('poster')?.textContent?.trim() || el.querySelector('logo')?.textContent?.trim() || '';
      const desc = el.querySelector('description')?.textContent?.trim() || '';
      const link = el.querySelector('link')?.textContent?.trim() || el.querySelector('stream_url')?.textContent?.trim() || '';
      const cat = el.querySelector('category')?.textContent?.trim() || (category === 'canais' ? 'Geral' : category);

      if (title) {
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
      }
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
