import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useUserLocation } from './hooks/useUserLocation'
import PumpMap from './components/PumpMap'
import AddPumpForm from './components/AddPumpForm'
import './App.css'

export default function App() {
  const [pumps, setPumps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newPumpLocation, setNewPumpLocation] = useState(null)
  const [locationNudge, setLocationNudge] = useState(null)
  const { location: userLocation, error: locationError } = useUserLocation()

  async function loadPumps() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pumps')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setPumps(data)
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPumps()
  }, [])

  useEffect(() => {
    if (!locationNudge) return
    const timer = setTimeout(() => setLocationNudge(null), 5000)
    return () => clearTimeout(timer)
  }, [locationNudge])

  function handlePumpAdded() {
    setNewPumpLocation(null)
    loadPumps()
  }

  function handleReportClick() {
    if (userLocation) {
      setNewPumpLocation(userLocation)
      return
    }

    if (!navigator.geolocation) {
      setLocationNudge("Your browser doesn't support location access.")
    } else if (locationError) {
      setLocationNudge(
        'Location access is blocked. Enable it for this site in your browser settings, then try again.',
      )
    } else {
      setLocationNudge(
        "Still getting your location — make sure you've allowed location access, then try again in a moment.",
      )
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚲 CPH Pumps</h1>
        <p>Crowdsourced bike pump locations in Copenhagen.</p>
      </header>

      {error && <div className="banner banner-error">Couldn't load pumps: {error}</div>}
      {!error && !import.meta.env.VITE_SUPABASE_URL && (
        <div className="banner banner-warning">
          No Supabase connection configured yet. Copy <code>.env.example</code> to{' '}
          <code>.env</code> and fill in your project's URL and anon key.
        </div>
      )}
      {locationError && (
        <div className="banner banner-warning">
          Couldn't get your location: {locationError}. You can still browse pumps on the map.
        </div>
      )}

      <PumpMap pumps={pumps} loading={loading} userLocation={userLocation} />

      {locationNudge && <div className="location-nudge">{locationNudge}</div>}

      <button
        type="button"
        className="report-fab"
        onClick={handleReportClick}
        aria-label="Report a pump at your location"
        title="Report a pump at your location"
      >
        +
      </button>

      {newPumpLocation && (
        <AddPumpForm
          location={newPumpLocation}
          onCancel={() => setNewPumpLocation(null)}
          onAdded={handlePumpAdded}
        />
      )}
    </div>
  )
}
