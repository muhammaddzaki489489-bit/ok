document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('url');
  const src = params.get('src') || 'dfilm';
  if (!url) { window.location.href = 'index.html'; return; }

  document.title = 'Nonton – ZooNime';

  const streamData = await API.stream(url, src);

  const playerBox = document.getElementById('playerBox');
  const epTitle = document.getElementById('epTitle');
  const epSource = document.getElementById('epSource');
  const downloadSection = document.getElementById('downloadSection');

  if (!streamData) {
    playerBox.innerHTML = '<div class="player-loading">❌ Video tidak tersedia</div>';
    epTitle.textContent = decodeURIComponent(url).replace(/-/g, ' ');
  } else if (streamData.type === 'iframe') {
    // ── Iframe player (donghuafilm) ──
    playerBox.innerHTML = `<iframe src="${streamData.url}" allowfullscreen allow="autoplay;fullscreen"></iframe>`;
    epTitle.textContent = streamData.title || decodeURIComponent(url).replace(/-/g, ' ');
    epSource.innerHTML = `Sumber: <span class="src-badge src-dfilm">DonghuaFilm</span>`;
    document.title = `${streamData.title || 'Nonton'} – ZooNime`;

  } else if (streamData.type === 'download') {
    // ── Download fallback (anichin) ──
    playerBox.innerHTML = `
      <div class="player-loading">
        <p style="font-size:1.5rem">📥</p>
        <p>Video hanya tersedia sebagai download</p>
        <p style="font-size:0.75rem;margin-top:4px">Lihat link download di bawah</p>
      </div>`;
    epTitle.textContent = streamData.title ? streamData.title.replace(/-/g, ' ') : 'Episode';
    epSource.innerHTML = `Sumber: <span class="src-badge src-achin">Anichin</span>`;

    // Render download links grouped by resolution
    const groups = {};
    streamData.links.forEach(group => {
      const res = group.resolution || 'Unknown';
      if (!groups[res]) groups[res] = [];
      // Deduplicate by host
      const seen = new Set(groups[res].map(l => l.host));
      group.links.forEach(l => { if (!seen.has(l.host)) { groups[res].push(l); seen.add(l.host); } });
    });

    // Show only unique resolutions (480p, 720p, 1080p)
    const resMap = {};
    streamData.links.forEach(g => {
      // Find resolution from link names
      g.links.forEach(l => {
        const m = l.url.match(/(480|720|1080)p/i);
        const res = m ? m[1] + 'p' : (g.resolution || '?');
        if (!resMap[res]) resMap[res] = [];
        if (!resMap[res].find(x => x.host === l.host)) resMap[res].push(l);
      });
    });

    const dlHtml = Object.entries(resMap).map(([res, links]) => `
      <div class="download-group">
        <div class="download-res">${res}</div>
        <div class="download-links">
          ${links.slice(0, 5).map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.host}</a>`).join('')}
        </div>
      </div>
    `).join('');

    downloadSection.innerHTML = `
      <div class="download-wrap">
        <div class="download-title">📥 Link Download</div>
        <div class="download-sub">Episode ini tersedia via download dari Anichin</div>
        ${dlHtml || '<p style="color:var(--text2);font-size:0.85rem">Tidak ada link tersedia</p>'}
      </div>`;
  }

  // ── Episode navigation ──
  const animeSlug = src === 'dfilm'
    ? url.replace(/-episode-\d+.*$/, '')
    : url.replace(/-episode-\d+.*$/, '');

  const currentEpNum = (() => { const m = url.match(/episode-(\d+)/i); return m ? parseInt(m[1]) : null; })();

  let detailSrc = src;
  let detailUrl = src === 'dfilm' ? animeSlug : `https://anichin.cafe/seri/${animeSlug}/`;

  const detail = await API.detail(detailUrl, detailSrc);
  const eps = detail?.episodes || [];

  if (eps.length) {
    const epListWrap = document.getElementById('epListWrap');
    const epList = document.getElementById('epList');
    epListWrap.style.display = 'block';

    const currentIdx = eps.findIndex(ep => {
      const epNum = parseInt(ep.number);
      return epNum === currentEpNum || ep.url === url || ep.url.includes(url);
    });

    function epWatchUrl(ep) {
      const epSrc = ep.src || src;
      if (epSrc === 'achin') {
        const slug = ep.url.replace('https://anichin.cafe/', '').replace(/\/$/, '');
        return `watch.html?url=${encodeURIComponent(slug)}&src=achin`;
      }
      return `watch.html?url=${encodeURIComponent(ep.url)}&src=dfilm`;
    }

    const prevEp = currentIdx < eps.length - 1 ? eps[currentIdx + 1] : null;
    const nextEp = currentIdx > 0 ? eps[currentIdx - 1] : null;

    document.getElementById('epNav').innerHTML = `
      ${prevEp ? `<a href="${epWatchUrl(prevEp)}" class="btn btn-outline btn-sm">← Ep ${prevEp.number}</a>` : '<div></div>'}
      <a href="detail.html?url=${encodeURIComponent(detailUrl)}&src=${detailSrc}" class="btn btn-outline btn-sm">📋 Semua</a>
      ${nextEp ? `<a href="${epWatchUrl(nextEp)}" class="btn btn-primary btn-sm">Ep ${nextEp.number} →</a>` : '<div></div>'}
    `;

    eps.forEach(ep => {
      const isActive = parseInt(ep.number) === currentEpNum;
      const item = document.createElement('div');
      item.className = `ep-list-item${isActive ? ' active' : ''}`;
      item.innerHTML = `<span class="dot"></span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Ep ${ep.number}</span>`;
      item.addEventListener('click', () => { window.location.href = epWatchUrl(ep); });
      epList.appendChild(item);
      if (isActive) setTimeout(() => item.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 400);
    });
  }
});
