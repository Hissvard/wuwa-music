import { $, esc } from './utils.js';
import { store, DEFAULT_ROLE, namesFor, peopleFor } from './store.js';
import { renderAlbumGrid } from './albumGrid.js';
import { bindAlbumLinks } from './albumModal.js';
import { tracksHtml, bindTrackTable } from './trackList.js';

const RELEASE_TYPES = ['Album', 'EP', 'Single'];
let releaseType = 'Album';

export function setupAlbumsView() {
  const form = $('#filters');
  form.role.innerHTML = '<option value="">Any role</option>' + store.roles.map((r) => `<option>${esc(r)}</option>`).join('');
  form.role.value = store.roles.includes(DEFAULT_ROLE) ? DEFAULT_ROLE : '';
  fillPeople();

  form.role.addEventListener('change', () => {
    fillPeople();
    renderAlbumsView();
  });
  form.addEventListener('input', (e) => {
    if (e.target.name !== 'role') renderAlbumsView();
  });
  form.addEventListener('reset', () => {
    // reset fires before the fields are actually cleared
    setTimeout(() => {
      form.role.value = DEFAULT_ROLE;
      fillPeople();
      renderAlbumsView();
    });
  });

  $('#type-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-type]');
    if (!tab) return;
    releaseType = tab.dataset.type;
    renderAlbumsView();
  });

  $('#filters-open').addEventListener('click', () => document.body.classList.add('filters-open'));
  $('#filters-close').addEventListener('click', () => document.body.classList.remove('filters-open'));
}

export function renderAlbumsView() {
  const filters = getFilters();
  const matches = (track) => trackMatches(track, filters);
  const activeFilters = [filters.search, filters.person, filters.from, filters.to].filter(Boolean).length;
  $('#filters-count').textContent = activeFilters || '';

  $('#type-tabs').hidden = Boolean(filters.search);
  if (filters.search) {
    renderSearchResults(store.tracks.filter(matches));
    return;
  }

  const visibleAlbums = store.albums.filter((album) => album.tracks.some(matches));
  const counts = Object.fromEntries(RELEASE_TYPES.map((type) => [type, visibleAlbums.filter((a) => a.type === type).length]));
  if (!counts[releaseType]) releaseType = RELEASE_TYPES.find((type) => counts[type]) ?? releaseType;
  const albums = visibleAlbums.filter((album) => album.type === releaseType);
  const trackCount = albums.reduce((sum, album) => sum + album.tracks.filter(matches).length, 0);

  $('#type-tabs').innerHTML = RELEASE_TYPES.map((type) => `
    <button type="button" data-type="${type}" class="${type === releaseType ? 'active' : ''}">
      ${type === 'Album' ? 'Albums' : `${type}s`} <span>${counts[type]}</span>
    </button>`).join('');
  $('#summary').textContent = `${trackCount} tracks in ${albums.length} releases`;

  if (!albums.length) {
    $('#albums').innerHTML = '<p class="empty">No tracks match these filters.</p>';
    return;
  }
  renderAlbumGrid($('#albums'), albums, (album) => album.tracks.filter(matches));
}

function renderSearchResults(tracks) {
  $('#summary').textContent = `${tracks.length} tracks found`;
  if (!tracks.length) {
    $('#albums').innerHTML = '<p class="empty">No tracks match this search.</p>';
    return;
  }

  $('#albums').innerHTML = `<div class="track-panel frame">${tracksHtml(tracks, { showAlbum: true })}</div>`;
  bindTrackTable($('#albums .tracks'), tracks);
  bindAlbumLinks($('#albums .tracks'));
}

function fillPeople() {
  const form = $('#filters');
  form.person.innerHTML = '<option value="">Everyone</option>' + peopleFor(form.role.value)
    .map((p) => `<option value="${esc(p.name)}">${esc(p.name)} (${p.count})</option>`)
    .join('');
}

function getFilters() {
  const form = $('#filters');
  return {
    search: form.search.value.trim().toLowerCase(),
    role: form.role.value,
    person: form.person.value,
    from: form.from.value,
    to: form.to.value,
  };
}

function trackMatches(track, filters) {
  if (filters.from && track.date < filters.from) return false;
  if (filters.to && track.date > filters.to) return false;
  if (filters.person && !namesFor(track, filters.role).includes(filters.person)) return false;

  if (filters.search) {
    const text = [track.title, ...namesFor(track, '')].join(' ').toLowerCase();
    if (!text.includes(filters.search)) return false;
  }
  return true;
}
