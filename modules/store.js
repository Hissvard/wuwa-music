export const DEFAULT_ROLE = 'Composer';
export const MAIN_ROLES = ['Composer', 'Lyricist', 'Vocal Solo'];

export const store = {
  albums: [],
  tracks: [],
  roles: [],
};

export async function loadData() {
  const data = await (await fetch('assets/song_data.json')).json();

  store.albums = data.albums;
  for (const album of store.albums) {
    for (const track of album.tracks) {
      track.album = album;
      track.date = track.releaseDate || album.releaseDate || `${album.year}-01-01`;
      store.tracks.push(track);
    }
  }

  const roleCounts = {};
  for (const track of store.tracks) {
    for (const role of Object.keys(track.staff)) {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }
  }
  store.roles = Object.keys(roleCounts).sort((a, b) => roleCounts[b] - roleCounts[a]);
}

export function findAlbum(id) {
  return store.albums.find((album) => album.id === id);
}

export function peopleFor(role) {
  const counts = {};
  for (const track of store.tracks) {
    for (const name of new Set(namesFor(track, role))) {
      counts[name] = (counts[name] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function namesFor(track, role) {
  return role ? track.staff[role] || [] : Object.values(track.staff).flat();
}

export function creditsOf(track, name) {
  return Object.keys(track.staff).filter((role) => track.staff[role].includes(name));
}
