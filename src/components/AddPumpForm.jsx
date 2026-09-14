import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AddPumpForm({ location, onCancel, onAdded }) {
  const [name, setName] = useState('')
  const [opensAt, setOpensAt] = useState('00:00')
  const [closesAt, setClosesAt] = useState('23:59')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

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
      setError(error.message)
      return
    }
    onAdded()
  }

  return (
    <div className="add-pump-overlay">
      <form className="add-pump-form" onSubmit={handleSubmit}>
        <h2>Report a bike pump</h2>
        <p className="coords">
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>

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

        {error && <p className="banner banner-error">{error}</p>}

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save pump'}
          </button>
        </div>
      </form>
    </div>
  )
}
