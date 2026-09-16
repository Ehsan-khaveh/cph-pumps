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

  function handlePumpAdded() {
    setNewPumpLocation(null)
    loadPumps()
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚲 CPH Pumps</h1>
        <p>Crowdsourced bike pump locations in Copenhagen. Click the map to report one.</p>
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
          Couldn't get your location: {locationError}. You can still browse and add pumps
          manually.
        </div>
      )}

      <PumpMap
        pumps={pumps}
        loading={loading}
        onMapClick={(latlng) => setNewPumpLocation(latlng)}
        userLocation={userLocation}
      />

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
