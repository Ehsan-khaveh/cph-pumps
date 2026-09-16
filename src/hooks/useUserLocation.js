import { useEffect, useState } from 'react'

export function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("This browser doesn't support location.")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setError(null)
      },
      (err) => {
        setError(err.message)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { location, error }
}
