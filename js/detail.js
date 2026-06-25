document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('url');
  const src = params.get('src') || 'dfilm';
  if (!url) { window.location.href = 'index.html'; return; }

  const data = await API.detail(url, src);
  if (!data) {
    document.getElementById('detailContent').innerHTML =
      '<div class="empty-state">❌ Gagal memuat detail. <a href="index.html">Kembali</a></div>';
    return;
  }

  document.title = `${data.title} – ZooNime`;
  const img = data.image || 'https://placehold.co/247x350/13131f/6c63ff?text=No+Image';
  const info = data.info || {};

  const statusBadge = data.status
    ? `<span class="badge ${data.status === 'Ongoing' ? 'badge-ongoing' : 'badge-completed'}">${data.status}</span>` : '';
  const typeBadge = (info.type || data.type) ? `<span class="badge badge-type">${info.type || data.type}</span>` : '';
  const ratingBadge = data.rating ? `<span class="badge badge-rating">⭐ ${data.rating}</span>` : '';
  const genreBadges = (data.genres || []).map(g => `<span class="badge badge-genre">${g}</span>`).join('');
  const srcBadge = `<span class="badge src-badge src-${data.source}">${data.source === 'dfilm' ? 'DonghuaFilm' : 'Anichin'}</span>`;

  const metaItems = [
    data.released ? `<div class="meta-item"><span class="meta-label">Rilis</span><span class="meta-value">${data.released}</span></div>` : '',
    data.studio ? `<div class="meta-item"><span class="meta-label">Studio</span><span class="meta-value">${data.studio}</span></div>` : '',
    data.duration ? `<div class="meta-item"><span class="meta-label">Durasi</span><span class="meta-value">${data.duration}</span></div>` : '',
    (info.episodes) ? `<div class="meta-item"><span class="meta-label">Episode</span><span class="meta-value">${info.episodes}</span></div>` : '',
    (info.fansub) ? `<div class="meta-item"><span class="meta-label">Fansub</span><span class="meta-value">${info.fansub}</span></div>` : '',
  ].filter(Boolean).join('');

  // Watch buttons
  const eps = data.episodes || [];
  const firstEp = eps[eps.length - 1];
  const lastEp = eps[0];

  function epWatchUrl(ep) {
    const epSrc = ep.src || data.source;
    if (epSrc === 'achin') {
      const slug = ep.url.replace('https://anichin.cafe/', '').replace(/\/$/, '');
      return `watch.html?url=${encodeURIComponent(slug)}&src=achin`;
    }
    return `watch.html?url=${encodeURIComponent(ep.url)}&src=dfilm`;
  }

  const watchBtns = lastEp
    ? `<a href="${epWatchUrl(lastEp)}" class="btn btn-primary">▶ Ep ${lastEp.number}</a>
       ${firstEp && firstEp !== lastEp ? `<a href="${epWatchUrl(firstEp)}" class="btn btn-outline">Ep 1</a>` : ''}`
    : '';

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-hero">
      <div class="detail-poster">
        <img src="${img}" alt="${data.title}" onerror="this.src='https://placehold.co/247x350/13131f/6c63ff?text=No+Image'"/>
      </div>
      <div class="detail-info">
        <h1 class="detail-title">${data.title}</h1>
        <div class="detail-badges">${statusBadge}${typeBadge}${ratingBadge}${srcBadge}${genreBadges}</div>
        <div class="detail-meta">${metaItems}</div>
        ${data.synopsis ? `<p class="detail-synopsis">${data.synopsis}</p>` : ''}
        <div class="detail-actions">${watchBtns}</div>
      </div>
    </div>
    <div class="ep-section-title">
      📋 Daftar Episode <span class="ep-count">(${eps.length})</span>
    </div>
    <div class="ep-grid" id="epGrid"></div>
  `;

  const epGrid = document.getElementById('epGrid');
  if (eps.length) {
    eps.forEach(ep => {
      const item = document.createElement('div');
      item.className = 'ep-item';
      item.innerHTML = `
        <div class="ep-num">${ep.number}</div>
        <div class="ep-text">
          <div class="ep-name">${ep.title}</div>
          ${ep.date ? `<div class="ep-date">${ep.date}</div>` : ''}
        </div>
        <span style="color:var(--text2);font-size:0.8rem">▶</span>
      `;
      item.addEventListener('click', () => { window.location.href = epWatchUrl(ep); });
      epGrid.appendChild(item);
    });
  } else {
    epGrid.innerHTML = '<div style="padding:16px;color:var(--text2);font-size:0.85rem">Belum ada episode.</div>';
  }
});
