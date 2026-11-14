export const ICONS = {
  play: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z"/></svg>',
};

export const $ = (selector) => document.querySelector(selector);

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '';
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function shortTitle(title) {
  return title.replace(/\s*\(Original Game Soundtrack\)\s*$/i, '');
}

export function staffUrl(name) {
  return `#/staff/${encodeURIComponent(name)}`;
}

export function youtubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
