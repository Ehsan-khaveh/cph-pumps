// Imports bicycle shops from OpenStreetMap (via Overpass API) into the
// `pumps` table as source='shop' rows, using each shop's opening_hours
// as a best-effort stand-in for pump availability.
//
// Usage:
//   npm run import:bike-shops
//
// Requires VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env (same file
// the app itself uses). Safe to re-run — shops already imported (matched
// by their OSM id) are skipped.

import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile()

const COPENHAGEN_CENTER = { lat: 55.6761, lng: 12.5683 }
const SEARCH_RADIUS_METERS = 20_000 // ~20km: Copenhagen, Frederiksberg, and close suburbs
const BATCH_SIZE = 50

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.\nCopy .env.example to .env and fill it in first.',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const WEEKDAY_CODES = ['Mo', 'Tu', 'We', 'Th', 'Fr']

// Best-effort simplification of OSM's opening_hours syntax down to a single
// daily window, since the pumps table only stores one opens_at/closes_at
// pair. The full raw string is preserved in notes so nothing is lost.
function parseOpeningHours(raw) {
  if (!raw) return { opensAt: null, closesAt: null }
  if (/^24\/7$/i.test(raw.trim())) return { opensAt: '00:00', closesAt: '23:59' }

  const rules = raw.split(';').map((rule) => rule.trim())

  // Prefer a weekday rule (e.g. "Mo-Fr 10:00-18:00") as the typical window.
  for (const rule of rules) {
    if (/off|closed/i.test(rule)) continue
    const time = rule.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/)
    const isWeekday = WEEKDAY_CODES.some((day) => rule.includes(day))
    if (time && isWeekday) return { opensAt: time[1], closesAt: time[2] }
  }

  // Otherwise fall back to the first time range found anywhere in the string.
  const anyTime = raw.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/)
  if (anyTime) return { opensAt: anyTime[1], closesAt: anyTime[2] }

  return { opensAt: null, closesAt: null }
}

async function fetchBikeShops() {
  const query = `
    [out:json][timeout:60];
    (
      node["shop"="bicycle"](around:${SEARCH_RADIUS_METERS},${COPENHAGEN_CENTER.lat},${COPENHAGEN_CENTER.lng});
    );
    out body;
  `

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: query,
  })

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.elements
}

function toPumpRow(element) {
  const tags = element.tags || {}
  const { opensAt, closesAt } = parseOpeningHours(tags.opening_hours)

  const noteParts = []
  if (tags.opening_hours) noteParts.push(`Hours (OSM): ${tags.opening_hours}`)
  const phone = tags.phone || tags['contact:phone']
  if (phone) noteParts.push(`Phone: ${phone}`)

  return {
    name: tags.name || tags['name:da'] || 'Bike shop',
    lat: element.lat,
    lng: element.lon,
    opens_at: opensAt,
    closes_at: closesAt,
    notes: noteParts.length ? noteParts.join(' · ') : null,
    source: 'shop',
    source_url: tags.website || tags['contact:website'] || null,
    osm_id: `node/${element.id}`,
  }
}

async function main() {
  console.log('Fetching bicycle shops from OpenStreetMap…')
  const elements = await fetchBikeShops()
  console.log(
    `Found ${elements.length} shop=bicycle node(s) within ${SEARCH_RADIUS_METERS / 1000}km of central Copenhagen.`,
  )

  const rows = elements
    .filter((el) => typeof el.lat === 'number' && typeof el.lon === 'number')
    .map(toPumpRow)

  const { data: existing, error: fetchError } = await supabase
    .from('pumps')
    .select('osm_id')
    .not('osm_id', 'is', null)

  if (fetchError) {
    throw new Error(`Couldn't read existing pumps: ${fetchError.message}`)
  }

  const existingIds = new Set((existing || []).map((row) => row.osm_id))
  const newRows = rows.filter((row) => !existingIds.has(row.osm_id))

  console.log(`${rows.length - newRows.length} already imported, ${newRows.length} new.`)

  if (newRows.length === 0) {
    console.log('Nothing to insert.')
    return
  }

  for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
    const batch = newRows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('pumps').insert(batch)
    if (error) {
      throw new Error(`Insert failed for batch starting at index ${i}: ${error.message}`)
    }
    console.log(`Inserted ${Math.min(i + BATCH_SIZE, newRows.length)}/${newRows.length}`)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
