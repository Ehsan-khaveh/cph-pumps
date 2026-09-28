# CPH Pumps

A crowdsourced map of bike pumps in Copenhagen — where they are, and when they're available.

## Stack

- [Vite](https://vite.dev/) + React
- [Leaflet](https://leafletjs.com/) + OpenStreetMap tiles (no API key needed)
- [Supabase](https://supabase.com/) for storage (Postgres + auto-generated REST API)

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) and create a free project.
2. In the SQL editor, run the contents of [`supabase/schema.sql`](./supabase/schema.sql) to create the `pumps` table.
   - Already have this table from before? Run [`supabase/migrations/002_add_source_fields.sql`](./supabase/migrations/002_add_source_fields.sql) instead to add the new columns in place.
3. In **Project Settings → API**, copy the **Project URL** and **anon public** key.

### 2. Configure the app

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from step 1.

### 3. Run it

```bash
npm install
npm run dev
```

Open the printed local URL. Tap **Report a new pump** to add one at your current location.

## Seeding data from OpenStreetMap

Rather than starting from an empty map, you can bulk-import bike shops from OpenStreetMap as a starting set of likely pump locations:

```bash
npm run import:bike-shops
```

This queries the [Overpass API](https://overpass-api.de/) for `shop=bicycle` nodes within ~20km of central Copenhagen and inserts them as `source: 'shop'` rows, using each shop's `opening_hours` tag as a best-effort availability window (OSM's opening-hours syntax is far richer than this app's single daily window, so the full original string is kept in `notes` for reference). Safe to re-run — shops already imported are skipped by their OSM id.

These are a starting assumption, not a verified fact: a bike shop being open doesn't guarantee it lets passersby use a pump. The map marks `source: 'shop'` pumps distinctly (an orange marker, with a "Bike shop · hours may vary" label) so that's visible to anyone browsing.

OpenStreetMap data is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [ODbL](https://opendatacommons.org/licenses/odbl/) — free to reuse and store, attribution required (already covered by the map's tile attribution).

## Deploying

Push this repo to GitHub and connect it to [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) (both free for this scale). Add the same two `VITE_SUPABASE_*` environment variables in the host's project settings.

## Data model

One table, `pumps`:

| column      | type      | notes                                          |
| ----------- | --------- | ----------------------------------------------- |
| id          | uuid      | primary key                                    |
| name        | text      | optional landmark/name                         |
| lat, lng    | float     | location                                       |
| opens_at    | time      | availability start                             |
| closes_at   | time      | availability end                               |
| notes       | text      | optional free-text notes                       |
| source      | text      | `'community'` (default) or `'shop'`            |
| source_url  | text      | website, for shop-sourced rows                 |
| osm_id      | text      | OpenStreetMap node id, for shop-sourced rows (unique, dedupes re-imports) |
| created_at  | timestamp | set automatically                              |

Row-level security allows anyone to **read** and **insert** pumps, but not edit or delete — bad data gets cleaned up manually for now. Tighten this later if you add moderation or accounts.

## Roadmap ideas

- "Still there?" confirm button to keep data fresh
- Flag/report a pump as missing
- Filter by currently-open pumps
- Mobile-friendly "find nearest pump" view
