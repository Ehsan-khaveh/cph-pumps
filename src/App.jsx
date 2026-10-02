import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useUserLocation } from './hooks/useUserLocation'
import PumpMap from './components/PumpMap'
import ReportPumpForm from './components/ReportPumpForm'
import './App.css'

export default function App() {
  const [pumps, setPumps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportFormOpen, setReportFormOpen] = useState(false)
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
    setReportFormOpen(false)
    loadPumps()
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

      <button
        type="button"
        className="report-fab"
        onClick={() => setReportFormOpen(true)}
        title="Report a new pump"
      >
        <span className="report-fab-icon" aria-hidden="true">
          +
        </span>
        Report a new pump
      </button>

      {reportFormOpen && (
        <ReportPumpForm
          userLocation={userLocation}
          onCancel={() => setReportFormOpen(false)}
          onAdded={handlePumpAdded}
        />
      )}
    </div>
  )
}
