import { $ } from './modules/utils.js';
import { loadData } from './modules/store.js';
import { setupCharts } from './modules/charts.js';
import { setupPlayer } from './modules/player.js';
import { setupAlbumModal, closeAlbumModal } from './modules/albumModal.js';
import { setupAlbumsView, renderAlbumsView } from './modules/albumsView.js';
import { renderStaffView } from './modules/staffView.js';
import { setupStatsView, renderStatsView } from './modules/statsView.js';

async function init() {
  try {
    await loadData();
  } catch (error) {
    $('#albums').innerHTML = location.protocol === 'file:'
      ? '<p class="empty">Open this page through a web server (e.g. <code>python -m http.server</code>), browsers block loading data from file://.</p>'
      : '<p class="empty">Could not load the track data.</p>';
    throw error;
  }

  setupCharts();
  setupPlayer();
  setupAlbumModal();
  setupAlbumsView();
  setupStatsView();

  window.addEventListener('hashchange', route);
  route();
}

function route() {
  const [, view, param] = (location.hash.slice(1) || '/').split('/');

  closeAlbumModal();
  document.querySelectorAll('.view').forEach((el) => (el.hidden = true));
  document.querySelectorAll('.topbar nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === (view || 'albums')));

  if (view === 'staff' && param) {
    $('#view-staff').hidden = false;
    renderStaffView(decodeURIComponent(param));
  } else if (view === 'stats') {
    $('#view-stats').hidden = false;
    renderStatsView();
  } else {
    $('#view-albums').hidden = false;
    renderAlbumsView();
  }
  window.scrollTo(0, 0);
}

init();
