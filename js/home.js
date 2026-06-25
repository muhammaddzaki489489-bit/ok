document.addEventListener('DOMContentLoaded', async () => {
  const [home, popular, latest] = await Promise.all([
    API.homeLatest(), API.popular(), API.latest()
  ]);
  renderCards('homeGrid', home.slice(0, 18));
  renderCards('popularGrid', popular.slice(0, 12));
  renderCards('latestGrid', latest.slice(0, 12));
});
