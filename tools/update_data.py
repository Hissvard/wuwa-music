import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ytmusicapi import YTMusic

CHANNEL_ID = "UCjLcZ_R6pWxCYwmZz6lQsLQ"
ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "assets" / "song_data.json"
THUMBNAIL_DIR = ROOT / "assets" / "thumbnails"
CACHE_FILE = Path(__file__).resolve().parent / "cache" / "descriptions.json"

# spaces and capitalization are ignored
KNOWN_ROLES = [
    "Composer", "Lyricist", "Arranger", "Vocal Solo", "Producer", "Executive Producer",
    "Mixing Engineer", "Mastering Engineer", "Recording Engineer", "Harmony Arranging",
    "Harmony Vocals", "String Arranger", "Coordination", "Supervisor", "Conductor",
    "Background Vocals", "Programmer", "Music Publisher", "Associated Performer",
    "Vocal Producer", "Audio Editing Engineer", "Vocal Editing Engineer", "Remixer",
    "Featured Artist", "Lead Vocals", "Electric Guitar", "Acoustic Guitar", "First Violin",
    "Second Violin", "Double Bass", "Erhu", "Dong Xiao",
]
ROLES_BY_KEY = {re.sub(r"[^a-z]", "", role.lower()): role for role in KNOWN_ROLES}

def load_env() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        key, _, value = line.partition("=")
        if key.strip() and not key.startswith("#"):
            os.environ.setdefault(key.strip(), value.strip())


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read()


def fetch_descriptions(video_ids: list[str], api_key: str) -> dict[str, str]:
    descriptions = {}
    for start in range(0, len(video_ids), 50):
        params = urllib.parse.urlencode({
            "part": "snippet",
            "id": ",".join(video_ids[start:start + 50]),
            "key": api_key,
        })
        data = json.loads(fetch(f"https://www.googleapis.com/youtube/v3/videos?{params}"))
        for item in data.get("items", []):
            descriptions[item["id"]] = item["snippet"]["description"]
    return descriptions


def normalize_role(role: str) -> str:
    key = re.sub(r"[^a-z]", "", role.lower())
    return ROLES_BY_KEY.get(key, role.strip().capitalize())


def parse_description(description: str) -> tuple[dict[str, list[str]], str | None]:
    staff = {}
    release_date = None
    in_credits = False

    for line in description.splitlines():
        line = line.strip()
        if line.startswith("℗"):
            in_credits = True
            continue
        if not in_credits or ":" not in line:
            continue

        label, value = (part.strip() for part in line.split(":", 1))
        if not label or not value:
            continue
        if label == "Released on":
            release_date = value
            continue

        names = staff.setdefault(normalize_role(label), [])
        if value not in names:
            names.append(value)

    return staff, release_date


def download_thumbnail(album_id: str, thumbnails: list[dict]) -> str:
    path = THUMBNAIL_DIR / f"{album_id}.jpg"
    if not path.exists():
        path.write_bytes(fetch(thumbnails[-1]["url"]))
    return path.relative_to(ROOT).as_posix()


def load_json(path: Path, default: Any) -> Any:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return default


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def list_releases(yt: YTMusic) -> list[dict]:
    artist = yt.get_artist(CHANNEL_ID)
    releases = []
    for section in ("albums", "singles"):
        info = artist.get(section)
        if info:
            releases += yt.get_artist_albums(info["browseId"], info["params"], limit=None)
    return releases


def build_track(track: dict, description: str) -> dict:
    staff, release_date = parse_description(description)
    return {
        "videoId": track["videoId"],
        "title": track["title"],
        "artists": [a["name"] for a in track["artists"] if a["id"] != CHANNEL_ID],
        "duration": track.get("duration_seconds"),
        "releaseDate": release_date,
        "staff": staff,
    }


def main() -> None:
    load_env()
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY in .env (see .env.example) or as an environment variable.")

    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    yt = YTMusic()
    descriptions = load_json(CACHE_FILE, {})

    releases = list_releases(yt)
    print(f"Found {len(releases)} releases on the channel")

    albums = []
    for index, release in enumerate(releases, 1):
        album_id = release["browseId"]
        info = yt.get_album(album_id)
        tracks = [t for t in info["tracks"] if t.get("videoId")]
        print(f"[{index}/{len(releases)}] {info['title']} ({len(tracks)} tracks)")
        albums.append({
            "id": album_id,
            "title": info["title"],
            "type": info.get("type") or release.get("type") or "Album",
            "year": info.get("year"),
            "playlistId": info.get("audioPlaylistId"),
            "thumbnail": download_thumbnail(album_id, info["thumbnails"]),
            "rawTracks": tracks,
        })

    missing = sorted({t["videoId"] for a in albums for t in a["rawTracks"]} - descriptions.keys())
    if missing:
        print(f"Fetching {len(missing)} new descriptions")
        descriptions |= fetch_descriptions(missing, api_key)
        save_json(CACHE_FILE, descriptions)

    for album in albums:
        album["tracks"] = [build_track(t, descriptions.get(t["videoId"], "")) for t in album.pop("rawTracks")]
        dates = [t["releaseDate"] for t in album["tracks"] if t["releaseDate"]]
        album["releaseDate"] = min(dates) if dates else None

    albums.sort(key=lambda a: a["releaseDate"] or "", reverse=True)
    save_json(DATA_FILE, {
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "albums": albums,
    })
    print(f"Done: {len(albums)} albums, {sum(len(a['tracks']) for a in albums)} tracks")


if __name__ == "__main__":
    main()
