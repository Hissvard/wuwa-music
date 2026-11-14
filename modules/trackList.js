import { ICONS, esc, formatTime, shortTitle, staffUrl, youtubeUrl } from './utils.js';
import { MAIN_ROLES } from './store.js';
import { currentTrack, isPlaying, playQueue, togglePlayback } from './player.js';

export function tracksHtml(tracks, { showAlbum = false } = {}) {
  return `<table class="tracks"><tbody>${tracks.map((track, i) => trackRowHtml(track, i, showAlbum)).join('')}</tbody></table>`;
}

export function bindTrackTable(table, tracks) {
  table.addEventListener('click', (e) => {
    const button = e.target.closest('[data-play]');
    if (!button) return;
    const index = Number(button.dataset.play);
    if (currentTrack()?.videoId === tracks[index].videoId) togglePlayback();
    else playQueue(tracks, index);
  });
}

function trackRowHtml(track, index, showAlbum) {
  const staff = staffHtml(track);
  const current = currentTrack()?.videoId === track.videoId;
  return `
    <tr class="${current ? 'playing' : ''}" data-video="${esc(track.videoId)}">
      <td class="track-num"><button data-play="${index}" title="Play/Pause">${current && isPlaying() ? ICONS.pause : ICONS.play}</button></td>
      ${showAlbum ? `<td class="track-thumb"><img src="${esc(track.album.thumbnail)}" alt="" loading="lazy" data-open-album="${esc(track.album.id)}" title="${esc(track.album.title)}"></td>` : ''}
      <td class="track-main">
        <div class="track-title">${esc(track.title)}</div>
        ${showAlbum ? `<button class="track-album" data-open-album="${esc(track.album.id)}">${esc(shortTitle(track.album.title))}</button>` : ''}
        <div class="track-date">${esc(track.date)}</div>
        <div class="staff-inline">${staff}</div>
      </td>
      <td class="track-staff-cell">${staff}</td>
      <td class="track-side">
        ${formatTime(track.duration)}<br>
        <a href="${esc(youtubeUrl(track.videoId))}" target="_blank" rel="noopener">YouTube ↗</a>
      </td>
    </tr>`;
}

function staffHtml(track) {
  const entries = Object.entries(track.staff);
  if (!entries.length) {
    return '<dl class="staff-list"><dt>—</dt><dd class="no-credits">No credits in the video description</dd></dl>';
  }

  const main = MAIN_ROLES.filter((role) => track.staff[role]).map((role) => [role, track.staff[role]]);
  const others = entries.filter(([role]) => !MAIN_ROLES.includes(role));
  let html = main.length ? `<dl class="staff-list">${staffRowsHtml(main)}</dl>` : '';
  if (others.length) {
    html += `
      <details class="staff-more">
        <summary>Detailed info</summary>
        <dl class="staff-list">${staffRowsHtml(others)}</dl>
      </details>`;
  }
  return html;
}

function staffRowsHtml(entries) {
  return entries
    .map(([role, names]) => `<dt>${esc(role)}</dt><dd>${names.map((n) => `<a href="${esc(staffUrl(n))}">${esc(n)}</a>`).join(', ')}</dd>`)
    .join('');
}
