document.addEventListener('DOMContentLoaded', async () => {
  const items = await API.popular();
  renderCards('grid', items);
});
