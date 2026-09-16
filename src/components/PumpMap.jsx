import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'

const COPENHAGEN_CENTER = [55.6761, 12.5683]

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

function formatHours(pump) {
  if (!pump.opens_at || !pump.closes_at) return 'Hours unknown'
  return `${pump.opens_at.slice(0, 5)}–${pump.closes_at.slice(0, 5)}`
}

function navigationUrl(pump) {
  return `https://www.google.com/maps/dir/?api=1&destination=${pump.lat},${pump.lng}`
}

export default function PumpMap({ pumps, loading, onMapClick }) {
  return (
    <MapContainer center={COPENHAGEN_CENTER} zoom={13} className="pump-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
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
    </MapContainer>
  )
}
