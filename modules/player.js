import { $, ICONS, esc, formatTime, staffUrl, youtubeUrl } from './utils.js';
import { MAIN_ROLES } from './store.js';

let ytPlayer = null;
let playerReady = false;
let pendingVideo = null;
let queue = [];
let queueIndex = -1;
let playing = false;

export function currentTrack() {
  return queue[queueIndex];
}

export function isPlaying() {
  return playing;
}

export function playQueue(tracks, index) {
  queue = tracks;
  playIndex(index);
}

export function togglePlayback() {
  if (!ytPlayer?.getPlayerState) return;
  if (ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
  else ytPlayer.playVideo();
}

export function updatePlayingRows() {
  const videoId = currentTrack()?.videoId;
  document.querySelectorAll('.tracks tr').forEach((tr) => {
    const current = tr.dataset.video === videoId;
    tr.classList.toggle('playing', current);
    tr.querySelector('[data-play]').innerHTML = current && playing ? ICONS.pause : ICONS.play;
  });
}

export function setupPlayer() {
  // the api calls this once loaded, so it has to exist before adding the script
  window.onYouTubeIframeAPIReady = createPlayer;
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  document.head.append(script);

  $('#btn-play').addEventListener('click', togglePlayback);
  $('#btn-prev').addEventListener('click', () => {
    if (ytPlayer?.getCurrentTime && ytPlayer.getCurrentTime() > 3) ytPlayer.seekTo(0, true);
    else playIndex(queueIndex - 1);
  });
  $('#btn-next').addEventListener('click', () => playIndex(queueIndex + 1));
  $('#volume').addEventListener('input', (e) => ytPlayer?.setVolume?.(Number(e.target.value)));

  const seek = $('#seek');
  let seeking = false;
  seek.addEventListener('input', () => (seeking = true));
  seek.addEventListener('change', () => {
    seeking = false;
    if (ytPlayer?.getDuration) ytPlayer.seekTo((seek.value / 100) * ytPlayer.getDuration(), true);
  });

  setInterval(() => {
    if (!ytPlayer?.getCurrentTime || seeking) return;
    const duration = ytPlayer.getDuration() || 0;
    const current = ytPlayer.getCurrentTime() || 0;
    seek.value = duration ? (current / duration) * 100 : 0;
    $('#time-current').textContent = formatTime(current);
    if (duration) $('#time-total').textContent = formatTime(duration);
  }, 500);
}

function playIndex(index) {
  if (index < 0 || index >= queue.length) return;
  queueIndex = index;
  const track = currentTrack();

  $('#player').hidden = false;
  $('#player-thumb').src = track.album.thumbnail;
  $('#player-thumb').title = track.album.title;
  $('#player-title').textContent = track.title;
  $('#player-credits').innerHTML = MAIN_ROLES.filter((role) => track.staff[role])
    .map((role) => `<em>${esc(role)}</em><span>${track.staff[role].map((n) => `<a href="${esc(staffUrl(n))}">${esc(n)}</a>`).join(', ')}</span>`)
    .join('') || `<em>Artists</em><span>${esc(track.artists.join(', '))}</span>`;
  $('#player-yt').href = youtubeUrl(track.videoId);
  $('#time-total').textContent = formatTime(track.duration);

  updatePlayingRows();
  loadVideo(track.videoId);
}

function loadVideo(videoId) {
  if (playerReady) ytPlayer.loadVideoById(videoId);
  else pendingVideo = videoId;
}

// created up front, booting the embed on the first click delays playback by a few seconds
function createPlayer() {
  ytPlayer = new YT.Player('yt-player', {
    playerVars: { playsinline: 1 },
    events: {
      onReady: (e) => {
        playerReady = true;
        e.target.setVolume(Number($('#volume').value));
        if (pendingVideo) e.target.loadVideoById(pendingVideo);
      },
      onStateChange: (e) => {
        playing = e.data === YT.PlayerState.PLAYING;
        $('#btn-play').innerHTML = playing ? ICONS.pause : ICONS.play;
        updatePlayingRows();
        if (e.data === YT.PlayerState.ENDED) playIndex(queueIndex + 1);
      },
    },
  });
}
