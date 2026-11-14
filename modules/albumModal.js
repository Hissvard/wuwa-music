import { $, ICONS, esc, shortTitle } from './utils.js';
import { findAlbum } from './store.js';
import { playQueue } from './player.js';
import { tracksHtml, bindTrackTable } from './trackList.js';

export function setupAlbumModal() {
  const modal = $('#album-modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal-close')) closeAlbumModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeAlbumModal();
  });
}

export function openAlbumModal(album, tracks) {
  const filtered = tracks.length !== album.tracks.length;
  const duration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const title = shortTitle(album.title);
  const playlistLink = album.playlistId
    ? `<a href="https://music.youtube.com/playlist?list=${esc(encodeURIComponent(album.playlistId))}" target="_blank" rel="noopener">Open on YouTube Music ↗</a>`
    : '';

  $('#album-modal-content').innerHTML = `
    <div class="modal-header">
      <img src="${esc(album.thumbnail)}" alt="">
      <div class="modal-info">
        <div class="modal-type">${esc(album.type)}${title !== album.title ? ' · Original Game Soundtrack' : ''}</div>
        <h2>${esc(title)}</h2>
        <p>${esc(album.releaseDate || album.year)} · ${filtered ? `${tracks.length} of ${album.tracks.length}` : tracks.length} tracks · ${Math.round(duration / 60)} min</p>
        <div class="modal-actions">
          <button class="round-btn" id="modal-play" title="Play">${ICONS.play}</button>
          ${playlistLink}
        </div>
      </div>
    </div>
    ${tracksHtml(tracks)}`;

  // set via JS: escaped entities in a style attribute get decoded before the CSS is parsed
  $('#album-modal-content .modal-header').style.setProperty('--cover', `url(${JSON.stringify(album.thumbnail)})`);
  $('#modal-play').addEventListener('click', () => playQueue(tracks, 0));
  bindTrackTable($('#album-modal-content .tracks'), tracks);

  $('#album-modal').hidden = false;
  $('#album-modal').scrollTop = 0;
  document.body.classList.add('modal-open');
}

export function bindAlbumLinks(container) {
  container.addEventListener('click', (e) => {
    const link = e.target.closest('[data-open-album]');
    if (!link) return;
    const album = findAlbum(link.dataset.openAlbum);
    openAlbumModal(album, album.tracks);
  });
}

export function closeAlbumModal() {
  $('#album-modal').hidden = true;
  document.body.classList.remove('modal-open');
}
