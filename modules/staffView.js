import { $, ICONS, esc } from './utils.js';
import { store, creditsOf } from './store.js';
import { drawLineChart } from './charts.js';
import { renderAlbumGrid } from './albumGrid.js';
import { playQueue } from './player.js';
import { tracksHtml, bindTrackTable } from './trackList.js';
import { bindAlbumLinks } from './albumModal.js';

export function renderStaffView(name) {
  const page = $('#staff-page');
  const isCredited = (track) => creditsOf(track, name).length > 0;
  const tracks = store.tracks.filter(isCredited);

  if (!tracks.length) {
    page.innerHTML = `<h1>${esc(name)}</h1><p class="empty">No credits found.</p>`;
    return;
  }

  const roleCounts = {};
  tracks.forEach((t) => creditsOf(t, name).forEach((role) => (roleCounts[role] = (roleCounts[role] || 0) + 1)));
  const roles = Object.keys(roleCounts).sort((a, b) => roleCounts[b] - roleCounts[a]);
  const albums = store.albums.filter((album) => album.tracks.some(isCredited));
  const dates = tracks.map((t) => t.date).sort();

  page.innerHTML = `
    <div class="staff-header">
      <div>
        <h1>${esc(name)}</h1>
        <p>${roles.map((r) => `${esc(r)} on ${roleCounts[r]} tracks`).join(' · ')}</p>
        <p>${tracks.length} tracks in ${albums.length} releases · ${esc(dates[0])} → ${esc(dates.at(-1))}</p>
      </div>
      <div class="staff-header-actions">
        <select id="staff-mode">
          <option value="cumulative">Cumulative</option>
          <option value="month">Per month</option>
        </select>
        <button class="round-btn" id="staff-play" title="Play all">${ICONS.play}</button>
      </div>
    </div>
    <div class="chart-box frame"><canvas id="staff-chart"></canvas></div>

    <h2 class="section-title">Releases</h2>
    <div id="staff-albums" class="album-grid staff-section"></div>

    <h2 class="section-title">Tracks</h2>
    <div class="track-panel frame staff-section">${tracksHtml(tracks, { showAlbum: true })}</div>`;

  const drawChart = () => drawLineChart(
    $('#staff-chart'),
    roles.map((role) => ({ label: role, tracks: tracks.filter((t) => creditsOf(t, name).includes(role)) })),
    $('#staff-mode').value,
  );
  $('#staff-mode').addEventListener('change', drawChart);
  drawChart();

  $('#staff-play').addEventListener('click', () => playQueue(tracks, 0));
  renderAlbumGrid($('#staff-albums'), albums, (album) => album.tracks.filter(isCredited));
  bindTrackTable($('#staff-page .tracks'), tracks);
  bindAlbumLinks($('#staff-page .tracks'));
}
