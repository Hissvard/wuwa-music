# WuWa Music Staff

Fan website to filter wuwa music by staff and get some stats.

# Bro why? Youtube eists

Because I like stats, and Youtube Music's UI is clunky for looking up specific staff e.g. filtering by Composer.

# Updates

New tracks can be updated by running:

```bash
pip install ytmusicapi
cp .env.example .env   # then put your key in YOUTUBE_API_KEY
python tools/update_data.py
```

Needs a Google Cloud Console API key with Youtube API V3 enabled.

## Running locally

The page loads the JSON with `fetch`, so it needs a local server, easiest way:

```bash
python -m http.server 8765
```
