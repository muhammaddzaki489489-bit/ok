const GENRES = [
  'action','adventure','comedian','comedy','demon','drama',
  'fanstasy','fantasy','historical','isekai','martial-arts',
  'movie','mystery','reincarnation','romance','school',
  'sci-fi','super-power','supranatural','xuanhuan'
];

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('genreList');
  const grid = document.getElementById('grid');

  GENRES.forEach(g => {
    const tag = document.createElement('div');
    tag.className = 'genre-tag';
    tag.textContent = g.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    tag.addEventListener('click', () => {
      document.querySelectorAll('.genre-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      loadGenre(g);
    });
    list.appendChild(tag);
  });

  const params = new URLSearchParams(window.location.search);
  const g = params.get('genre');
  if (g) {
    const tag = [...list.querySelectorAll('.genre-tag')].find(t =>
      t.textContent.toLowerCase().replace(/\s+/g, '-') === g
    );
    if (tag) { tag.classList.add('active'); loadGenre(g); }
  }

  async function loadGenre(genre) {
    grid.style.display = 'grid';
    grid.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(6);
    try {
      const res = await _get(`https://api.theresav.biz.id/anime/donghuafilm/genre?genre=${genre}&apikey=S3ItA`);
      if (res.status && res.data && res.data.length) {
        renderCards('grid', res.data.map(i => ({
          title: i.title, image: i.image, episode: i.episode,
          type: i.type, sourceUrl: i.url, source: 'dfilm'
        })));
      } else {
        grid.innerHTML = '<div class="empty-state">Tidak ada donghua untuk genre ini.</div>';
      }
    } catch {
      grid.innerHTML = '<div class="empty-state">Gagal memuat data.</div>';
    }
  }
});
