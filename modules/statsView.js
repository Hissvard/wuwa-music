import { $, esc, staffUrl } from './utils.js';
import { store, peopleFor } from './store.js';
import { drawLineChart } from './charts.js';

const STAT_ROLES = [
  { role: 'Vocal Solo', label: 'Vocalists' },
  { role: 'Composer', label: 'Composers' },
];
// the game channel is listed as vocalist on almost every track
const IGNORED_NAMES = ['Wuthering Waves'];

let activeRole = STAT_ROLES[0].role;

export function setupStatsView() {
  $('#stats-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-role]');
    if (!tab) return;
    activeRole = tab.dataset.role;
    renderStatsView();
  });
  $('#stats-mode').addEventListener('change', drawTimeline);
}

export function renderStatsView() {
  $('#stats-tabs').innerHTML = STAT_ROLES.map(({ role, label }) => `
    <button type="button" data-role="${esc(role)}" class="${role === activeRole ? 'active' : ''}">${esc(label)}</button>`).join('');

  renderRanking(statPeople());
  drawTimeline();
}

function renderRanking(people) {
  const max = people[0]?.count || 1;
  $('#stats-ranking').innerHTML = people.map(({ name, count }, i) => `
    <li class="${i < 3 ? 'top' : ''}">
      <span class="rank-name" title="${esc(name)}">${esc(name)}</span>
      <span class="rank-bar"><span style="width: ${(count / max) * 100}%"></span></span>
      <span class="rank-count">${count}</span>
      <a class="rank-details" href="${esc(staffUrl(name))}">Details</a>
    </li>`).join('');
}

function drawTimeline() {
  drawLineChart(
    $('#stats-timeline'),
    statPeople().map(({ name }) => ({ label: name, tracks: store.tracks.filter((t) => (t.staff[activeRole] || []).includes(name)) })),
    $('#stats-mode').value,
    { many: true },
  );
}

function statPeople() {
  return peopleFor(activeRole).filter(({ name }) => !IGNORED_NAMES.includes(name));
}
