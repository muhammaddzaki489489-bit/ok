document.addEventListener('DOMContentLoaded', async () => {
  const items = await API.latest();
  renderCards('grid', items);
});
