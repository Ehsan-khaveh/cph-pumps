import { useState } from 'react'
import { supabase } from '../supabaseClient'

async function geocodeAddress(query) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    countrycodes: 'dk',
    limit: '1',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!response.ok) {
    throw new Error(`Address search failed (${response.status})`)
  }

  const results = await response.json()
  if (results.length === 0) return null

  const [result] = results
  return { lat: Number(result.lat), lng: Number(result.lon), label: result.display_name }
}

export default function ReportPumpForm({ userLocation, onCancel, onAdded }) {
  const [locationMode, setLocationMode] = useState(userLocation ? 'current' : 'address')
  const [addressQuery, setAddressQuery] = useState('')
  const [addressLocation, setAddressLocation] = useState(null)
  const [searching, setSearching] = useState(false)
  const [geocodeError, setGeocodeError] = useState(null)

  const [name, setName] = useState('')
  const [opensAt, setOpensAt] = useState('00:00')
  const [closesAt, setClosesAt] = useState('23:59')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const location = locationMode === 'current' ? userLocation : addressLocation

  async function handleSearchAddress(e) {
    e.preventDefault()
    if (!addressQuery.trim() || searching) return

    setSearching(true)
    setGeocodeError(null)
    setAddressLocation(null)

    try {
      const result = await geocodeAddress(addressQuery)
      if (!result) {
        setGeocodeError("Couldn't find that address. Try adding a street number or city.")
      } else {
        setAddressLocation(result)
      }
    } catch (err) {
      setGeocodeError(err.message)
    } finally {
      setSearching(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!location) return

    setSubmitting(true)
    setSubmitError(null)

    const { error } = await supabase.from('pumps').insert({
      name: name || null,
      lat: location.lat,
      lng: location.lng,
      opens_at: opensAt,
      closes_at: closesAt,
      notes: notes || null,
    })

    setSubmitting(false)

    if (error) {
      setSubmitError(error.message)
      return
    }
    onAdded()
  }

  return (
    <div className="add-pump-overlay">
      <form className="add-pump-form" onSubmit={handleSubmit}>
        <h2>Report a bike pump</h2>

        <div className="location-mode-tabs">
          <button
            type="button"
            className={locationMode === 'current' ? 'active' : ''}
            onClick={() => setLocationMode('current')}
          >
            My location
          </button>
          <button
            type="button"
            className={locationMode === 'address' ? 'active' : ''}
            onClick={() => setLocationMode('address')}
          >
            Enter an address
          </button>
        </div>

        {locationMode === 'current' &&
          (userLocation ? (
            <p className="coords">
              Using your current location ({userLocation.lat.toFixed(5)},{' '}
              {userLocation.lng.toFixed(5)})
            </p>
          ) : (
            <p className="banner banner-warning">
              Location access isn't available. Enable it in your browser, or switch to "Enter an
              address".
            </p>
          ))}

        {locationMode === 'address' && (
          <div className="address-search">
            <div className="address-search-row">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                placeholder="e.g. Nørrebrogade 1, København"
              />
              <button type="button" onClick={handleSearchAddress} disabled={searching}>
                {searching ? 'Finding…' : 'Find'}
              </button>
            </div>
            {geocodeError && <p className="banner banner-error">{geocodeError}</p>}
            {addressLocation && <p className="coords">Found: {addressLocation.label}</p>}
          </div>
        )}

        <label>
          Name / landmark (optional)
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nørrebro station"
          />
        </label>

        <div className="hours-row">
          <label>
            Opens
            <input type="time" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
          </label>
          <label>
            Closes
            <input type="time" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </label>
        </div>

        <label>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. only fits Presta valves"
          />
        </label>

        {submitError && <p className="banner banner-error">{submitError}</p>}

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting || !location}>
            {submitting ? 'Saving…' : 'Save pump'}
          </button>
        </div>
      </form>
    </div>
  )
}
