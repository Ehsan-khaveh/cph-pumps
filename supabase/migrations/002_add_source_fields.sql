-- Run this in the Supabase SQL editor if your `pumps` table already exists
-- (i.e. you set the project up before this migration was added).
-- Fresh installs get these columns directly from supabase/schema.sql instead.

alter table public.pumps
  add column if not exists source text not null default 'community',
  add column if not exists source_url text,
  add column if not exists osm_id text;

create unique index if not exists pumps_osm_id_key on public.pumps (osm_id) where osm_id is not null;
