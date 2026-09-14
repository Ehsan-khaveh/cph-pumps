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

Open the printed local URL. Click anywhere on the map to report a pump.

## Deploying

Push this repo to GitHub and connect it to [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/) (both free for this scale). Add the same two `VITE_SUPABASE_*` environment variables in the host's project settings.

## Data model

One table, `pumps`:

| column      | type      | notes                          |
| ----------- | --------- | ------------------------------ |
| id          | uuid      | primary key                    |
| name        | text      | optional landmark/name         |
| lat, lng    | float     | location                       |
| opens_at    | time      | availability start             |
| closes_at   | time      | availability end                |
| notes       | text      | optional free-text notes       |
| created_at  | timestamp | set automatically              |

Row-level security allows anyone to **read** and **insert** pumps, but not edit or delete — bad data gets cleaned up manually for now. Tighten this later if you add moderation or accounts.

## Roadmap ideas

- "Still there?" confirm button to keep data fresh
- Flag/report a pump as missing
- Filter by currently-open pumps
- Mobile-friendly "find nearest pump" view
