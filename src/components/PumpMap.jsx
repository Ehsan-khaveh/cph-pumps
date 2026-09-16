import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet'

const COPENHAGEN_CENTER = [55.6761, 12.5683]

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<span class="user-location-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

function RecenterOnFirstFix({ location }) {
  const map = useMap()
  const hasCenteredRef = useRef(false)

  useEffect(() => {
    if (location && !hasCenteredRef.current) {
      map.setView([location.lat, location.lng], 15)
      hasCenteredRef.current = true
    }
  }, [location, map])

  return null
}

function formatHours(pump) {
  if (!pump.opens_at || !pump.closes_at) return 'Hours unknown'
  return `${pump.opens_at.slice(0, 5)}–${pump.closes_at.slice(0, 5)}`
}

function navigationUrl(pump) {
  return `https://www.google.com/maps/dir/?api=1&destination=${pump.lat},${pump.lng}`
}

export default function PumpMap({ pumps, loading, onMapClick, userLocation }) {
  return (
    <MapContainer center={COPENHAGEN_CENTER} zoom={13} className="pump-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <RecenterOnFirstFix location={userLocation} />
      {!loading &&
        pumps.map((pump) => (
          <Marker key={pump.id} position={[pump.lat, pump.lng]}>
            <Popup>
              <strong>{pump.name || 'Bike pump'}</strong>
              <br />
              {formatHours(pump)}
              {pump.notes && (
                <>
                  <br />
                  <em>{pump.notes}</em>
                </>
              )}
              <br />
              <a
                className="navigate-link"
                href={navigationUrl(pump)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Navigate →
              </a>
            </Popup>
          </Marker>
        ))}
      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={userLocation.accuracy}
            pathOptions={{ color: '#2b6cb0', fillColor: '#2b6cb0', fillOpacity: 0.12, weight: 1 }}
          />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  )
}
