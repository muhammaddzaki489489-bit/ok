const API_KEY = 'S3ItA';
const BASE = 'https://api.theresav.biz.id/anime';

// ── Raw API calls ──────────────────────────────────────────────────────────

const DFILM = {
  async home()         { return _get(`${BASE}/donghuafilm/home?apikey=${API_KEY}`); },
  async latest()       { return _get(`${BASE}/donghuafilm/latest?apikey=${API_KEY}`); },
  async popular()      { return _get(`${BASE}/donghuafilm/popular?apikey=${API_KEY}`); },
  async search(q)      { return _get(`${BASE}/donghuafilm/search?q=${enc(q)}&apikey=${API_KEY}`); },
  async detail(url)    { return _get(`${BASE}/donghuafilm/detail?url=${enc(url)}&apikey=${API_KEY}`); },
  async stream(url)    { return _get(`${BASE}/donghuafilm/stream?url=${enc(url)}&apikey=${API_KEY}`); },
};

const ACHIN = {
  async home()         { return _get(`${BASE}/anichin/home?apikey=${API_KEY}`); },
  async latest()       { return _get(`${BASE}/anichin/latest?apikey=${API_KEY}`); },
  async detail(url)    { return _get(`${BASE}/anichin/detail?url=${enc(url)}&apikey=${API_KEY}`); },
  async episodes(url)  { return _get(`${BASE}/anichin/episode?url=${enc(url)}&apikey=${API_KEY}`); },
  async download(url)  { return _get(`${BASE}/anichin/download?url=${enc(url)}&apikey=${API_KEY}`); },
  async search(q)      { return _get(`${BASE}/anichin/search?q=${enc(q)}&apikey=${API_KEY}`); },
};

async function _get(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch { return { status: false }; }
}
function enc(v) { return encodeURIComponent(v); }

// ── Normalizers ────────────────────────────────────────────────────────────
// Normalize to unified card format: { title, image, episode, type, sourceUrl, source }

function normDfilm(item) {
  return {
    title: item.title,
    image: item.image && !item.image.startsWith('data:') ? item.image : null,
    episode: item.episode || null,
    type: item.type || 'Donghua',
    sourceUrl: item.url || null,   // full URL from donghuafilm.com
    source: 'dfilm',
  };
}

function normAchin(item) {
  // latest_update uses item.url, popular_today uses item.url
  return {
    title: item.title,
    image: item.thumbnail || null,
    episode: item.episode || null,
    type: item.type || 'Donghua',
    sourceUrl: item.url || item.link || null,
    source: 'achin',
  };
}

// Extract slug for routing
// dfilm detail slug:  e.g. "renegade-immortal"  → detail.html?s=renegade-immortal&src=dfilm
// dfilm stream slug:  e.g. "renegade-immortal-episode-146-subtitle-indonesia"
// achin detail url:   full URL https://anichin.cafe/seri/xxx/
// achin ep url:       full URL https://anichin.cafe/xxx-episode-N/

function cardUrl(item) {
  if (item.source === 'dfilm') {
    // sourceUrl is full URL like https://donghuafilm.com/renegade-immortal/
    // or episode URL like https://donghuafilm.com/renegade-immortal-episode-146.../
    const path = item.sourceUrl
      ? item.sourceUrl.replace('https://donghuafilm.com/', '').replace(/\/$/, '')
      : '';
    // If it's a series page (contains /anime/) → detail
    const isEp = !path.startsWith('anime/');
    if (isEp && item.episode && path) {
      return `watch.html?url=${enc(path)}&src=dfilm`;
    }
    // series slug
    const slug = path.replace(/^anime\//, '');
    return `detail.html?url=${enc(slug)}&src=dfilm`;
  }
  // achin
  if (item.source === 'achin') {
    const url = item.sourceUrl || '';
    const isSeries = url.includes('/seri/');
    if (isSeries) {
      return `detail.html?url=${enc(url)}&src=achin`;
    }
    // episode page
    const slug = url.replace('https://anichin.cafe/', '').replace(/\/$/, '');
    return `watch.html?url=${enc(slug)}&src=achin`;
  }
  return '#';
}

// ── Unified API ────────────────────────────────────────────────────────────

const API = {
  async homeLatest() {
    // Try donghuafilm first (episode updates)
    const r = await DFILM.home();
    if (r.status && r.data && r.data.length) return r.data.map(normDfilm);
    // Fallback anichin
    const r2 = await ACHIN.home();
    if (r2.status && r2.result) return (r2.result.latest_update || []).map(normAchin);
    return [];
  },

  async latest() {
    const r = await DFILM.latest();
    if (r.status && r.data && r.data.length) return r.data.map(normDfilm);
    const r2 = await ACHIN.latest();
    if (r2.status && r2.result) return r2.result.map(normAchin);
    return [];
  },

  async popular() {
    const r = await DFILM.popular();
    if (r.status && r.data && r.data.length) return r.data.map(normDfilm);
    const r2 = await ACHIN.home();
    if (r2.status && r2.result) return (r2.result.popular_today || []).map(normAchin);
    return [];
  },

  async search(q) {
    const [r1, r2] = await Promise.all([DFILM.search(q), ACHIN.search(q)]);
    const out = [];
    const seen = new Set();
    if (r1.status && r1.data) r1.data.forEach(i => {
      if (!seen.has(i.title)) { seen.add(i.title); out.push(normDfilm(i)); }
    });
    if (r2.status && r2.result) r2.result.forEach(i => {
      if (!seen.has(i.title)) { seen.add(i.title); out.push(normAchin(i)); }
    });
    return out;
  },

  // Detail page
  async detail(url, src) {
    if (src === 'achin') {
      const r = await ACHIN.detail(url);
      if (r.status && r.result) {
        const d = r.result;
        // Also get episode list
        const ep = await ACHIN.episodes(url);
        const episodes = (ep.status && ep.result) ? ep.result : [];
        return {
          title: d.title, image: d.thumbnail, rating: d.rating,
          synopsis: d.synopsis, status: d.status, studio: d.studio,
          released: d.released, duration: d.duration, genres: d.genres || [],
          episodes: episodes.map(e => ({
            number: e.episodeNumber, title: e.title, date: e.releaseDate,
            url: e.link, src: 'achin'
          })),
          source: 'achin', sourceUrl: url,
        };
      }
    }
    // donghuafilm (default)
    const r = await DFILM.detail(url);
    if (r.status && r.data) {
      const d = r.data;
      return {
        title: d.title,
        image: d.image && !d.image.startsWith('data:') ? d.image : null,
        rating: d.rating ? d.rating.replace(/[^0-9.]/g, '') : null,
        synopsis: d.synopsis, status: d.info?.status, studio: d.info?.studio,
        released: d.info?.released, duration: d.info?.duration,
        genres: d.genres || [],
        episodes: (d.episodes || []).map(e => ({
          number: e.episode, title: e.title, date: e.date,
          url: e.url.replace('https://donghuafilm.com/', '').replace(/\/$/, ''),
          src: 'dfilm'
        })),
        source: 'dfilm', sourceUrl: url,
        info: d.info || {},
      };
    }
    return null;
  },

  // Stream / watch page
  async stream(url, src) {
    if (src === 'dfilm') {
      const r = await DFILM.stream(url);
      if (r.status && r.data && r.data.stream_url) {
        return { type: 'iframe', url: r.data.stream_url, title: r.data.title, source: 'dfilm' };
      }
    }
    if (src === 'achin') {
      // Reconstruct full anichin URL
      const fullUrl = url.startsWith('http') ? url : `https://anichin.cafe/${url}/`;
      // Get series URL from slug for download
      // episode slug e.g. perfect-world-episode-274-subtitle-indonesia
      // series url  = https://anichin.cafe/seri/perfect-world/
      const seriesSlug = url.replace(/-episode-\d+.*$/, '');
      const seriesUrl = `https://anichin.cafe/seri/${seriesSlug}/`;
      const r = await ACHIN.download(seriesUrl);
      if (r.status && r.result && r.result.length) {
        return { type: 'download', links: r.result, title: url.replace(/-/g, ' '), source: 'achin' };
      }
    }
    // Fallback: try dfilm then achin
    const r1 = await DFILM.stream(url);
    if (r1.status && r1.data && r1.data.stream_url) {
      return { type: 'iframe', url: r1.data.stream_url, title: r1.data.title, source: 'dfilm' };
    }
    return null;
  }
};

// ── Card Builder ────────────────────────────────────────────────────────────

function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  const img = item.image || 'https://placehold.co/247x350/13131f/6c63ff?text=No+Image';
  const ep = item.episode;
  const isOngoing = ep === 'Ongoing';
  const isCompleted = ep === 'Completed';
  const badgeClass = isOngoing ? 'green' : isCompleted ? '' : ep ? 'green' : '';

  card.innerHTML = `
    <div class="card-poster">
      <img src="${img}" alt="${item.title}" loading="lazy"
        onerror="this.src='https://placehold.co/247x350/13131f/6c63ff?text=No+Image'" />
      ${ep ? `<div class="card-badge ${badgeClass}">${ep}</div>` : ''}
      <div class="card-src-badge src-${item.source}">${item.source === 'dfilm' ? 'DF' : 'AC'}</div>
      <div class="card-overlay"><span class="card-overlay-text">${item.title}</span></div>
    </div>
    <div class="card-info">
      <div class="card-title">${item.title}</div>
    </div>
  `;

  card.addEventListener('click', () => { window.location.href = cardUrl(item); });
  return card;
}

function renderCards(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  if (!items?.length) { el.innerHTML = '<div class="empty-state">Tidak ada data.</div>'; return; }
  items.forEach(i => el.appendChild(buildCard(i)));
}

// ── Navbar hamburger ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.toggle('open');
  });
});
