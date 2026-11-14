import { store } from './store.js';

const COLORS = ['#c9ac67', '#b8a2ec', '#7fc8e8', '#ef9dd5', '#8fd3b0', '#f2a072', '#8e8cf0', '#f4f0e3', '#e07a8f', '#6fb5a8', '#d6c27a', '#a3a0b5'];
const charts = {};

export function setupCharts() {
  Chart.defaults.color = '#9a94ab';
  Chart.defaults.borderColor = 'rgba(226, 220, 240, 0.08)';
  Chart.defaults.font.family = '"Noto Sans", "Noto Sans SC", sans-serif';
}

export function monthSeries(tracks, mode) {
  const months = [...new Set(store.tracks.map((t) => t.date.slice(0, 7)))].sort();
  const perMonth = months.map((m) => tracks.filter((t) => t.date.startsWith(m)).length);
  if (mode !== 'cumulative') return { labels: months, data: perMonth };
  let total = 0;
  return { labels: months, data: perMonth.map((n) => (total += n)) };
}

export function drawLineChart(canvas, series, mode, { many = false } = {}) {
  draw(canvas, {
    type: 'line',
    data: {
      labels: monthSeries([], mode).labels,
      datasets: series.map(({ label, tracks }, i) => {
        const color = COLORS[i % COLORS.length];
        return {
          label,
          data: monthSeries(tracks, mode).data,
          borderColor: color,
          backgroundColor: color,
          borderWidth: many ? 1.5 : 2,
          tension: 0.25,
          pointRadius: many ? 0 : 2,
        };
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: many ? { mode: 'nearest', intersect: false } : { mode: 'index', intersect: false },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: { legend: { display: !many, labels: { boxWidth: 12 } } },
    },
  });
}

function draw(canvas, config) {
  charts[canvas.id]?.destroy();
  charts[canvas.id] = new Chart(canvas, config);
}
