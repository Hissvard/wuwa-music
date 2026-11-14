import { ICONS, esc, shortTitle } from './utils.js';
import { findAlbum } from './store.js';
import { playQueue } from './player.js';
import { openAlbumModal } from './albumModal.js';

export function renderAlbumGrid(container, albums, getTracks) {
  container.innerHTML = albums.map((album) => albumCardHtml(album, getTracks(album))).join('');

  container.querySelectorAll('.album').forEach((card) => {
    const album = findAlbum(card.dataset.album);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.album-play')) playQueue(getTracks(album), 0);
      else openAlbumModal(album, getTracks(album));
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openAlbumModal(album, getTracks(album));
    });
  });
}

function albumCardHtml(album, tracks) {
  const countLabel = tracks.length === album.tracks.length ? `${tracks.length} tracks` : `${tracks.length} of ${album.tracks.length} tracks match`;
  return `
    <article class="album" data-album="${esc(album.id)}" tabindex="0">
      <div class="cover">
        <img src="${esc(album.thumbnail)}" alt="" loading="lazy">
        <button class="round-btn album-play" title="Play">${ICONS.play}</button>
      </div>
      <span class="track-count" title="${countLabel}">${tracks.length}</span>
      <div class="album-meta">
        <strong title="${esc(album.title)}">${esc(shortTitle(album.title))}</strong>
        <span>${esc(album.releaseDate || album.year)}</span>
      </div>
    </article>`;
}
