create extension if not exists "pgcrypto";

create table if not exists public.pumps (
  id uuid primary key default gen_random_uuid(),
  name text,
  lat double precision not null,
  lng double precision not null,
  opens_at time,
  closes_at time,
  notes text,
  source text not null default 'community',
  source_url text,
  osm_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists pumps_osm_id_key on public.pumps (osm_id) where osm_id is not null;

alter table public.pumps enable row level security;

-- Anyone can read pump locations
create policy "Public read access"
  on public.pumps for select
  using (true);

-- Anyone can report a new pump; updates/deletes are left to manual moderation
create policy "Public insert access"
  on public.pumps for insert
  with check (true);
