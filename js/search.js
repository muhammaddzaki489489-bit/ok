document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');

  if (q) { input.value = q; doSearch(q); }

  btn.addEventListener('click', () => { const v = input.value.trim(); if (v) doSearch(v); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { const v = input.value.trim(); if (v) doSearch(v); } });

  async function doSearch(query) {
    const grid = document.getElementById('grid');
    const empty = document.getElementById('emptyState');
    const srcInfo = document.getElementById('srcInfo');
    empty.style.display = 'none';
    srcInfo.style.display = 'none';
    grid.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(6);

    const items = await API.search(query);
    if (!items.length) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    // Show sources
    const sources = [...new Set(items.map(i => i.source))];
    srcInfo.style.display = 'block';
    document.getElementById('srcBadges').innerHTML = sources.map(s =>
      `<span class="src-badge src-${s}">${s === 'dfilm' ? 'DonghuaFilm' : 'Anichin'}</span>`
    ).join(' ');

    renderCards('grid', items);
  }
});
