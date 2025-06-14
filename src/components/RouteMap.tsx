
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, RouteResult } from '@/lib/pathfinding';

// Fix for default markers in Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const sourceIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMyA5IDktNyA5IDd2MTFhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iOSwyMiA5LDEyIDE1LDEyIDE1LDIyIi8+PC9zdmc+',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
});

const destinationIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOS02LTktMTNhOSA5IDAgMCAxIDE4IDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
});

interface RouteMapProps {
  source: Location | null;
  destination: Location | null;
  route: RouteResult | null;
  selectionMode: 'source' | 'destination' | null;
  onLocationSelect: (location: Location, type: 'source' | 'destination') => void;
  onMapCenter: (location: Location) => void;
}

// Map event handler component
function MapClickHandler({ 
  selectionMode, 
  onLocationSelect 
}: {
  selectionMode: 'source' | 'destination' | null;
  onLocationSelect: (location: Location, type: 'source' | 'destination') => void;
}) {
  useMapEvents({
    click: (e) => {
      if (selectionMode) {
        const location: Location = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          name: `${selectionMode === 'source' ? 'Source' : 'Destination'} (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`
        };
        onLocationSelect(location, selectionMode);
      }
    }
  });
  return null;
}

export default function RouteMap({ 
  source, 
  destination, 
  route, 
  selectionMode, 
  onLocationSelect,
  onMapCenter 
}: RouteMapProps) {
  const mapRef = useRef<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // New York
  const [mapZoom, setMapZoom] = useState(13);

  // Update map center when locations change
  useEffect(() => {
    if (route && route.path.length > 0) {
      const bounds = route.path.map(node => [node.lat, node.lng] as [number, number]);
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (destination) {
      setMapCenter([destination.lat, destination.lng]);
      setMapZoom(13);
    } else if (source) {
      setMapCenter([source.lat, source.lng]);
      setMapZoom(13);
    }
  }, [source, destination, route]);

  // Generate route line coordinates
  const routeCoordinates = route 
    ? route.path.map(node => [node.lat, node.lng] as [number, number])
    : [];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        {/* Map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Click handler for location selection */}
        <MapClickHandler 
          selectionMode={selectionMode} 
          onLocationSelect={onLocationSelect} 
        />

        {/* Source marker */}
        {source && (
          <Marker 
            position={[source.lat, source.lng]} 
            icon={sourceIcon}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-green-600">Source</h3>
                <p className="text-sm">{source.name}</p>
                <p className="text-xs text-gray-500">
                  {source.lat.toFixed(4)}, {source.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker 
            position={[destination.lat, destination.lng]} 
            icon={destinationIcon}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-red-600">Destination</h3>
                <p className="text-sm">{destination.name}</p>
                <p className="text-xs text-gray-500">
                  {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10'
            }}
          />
        )}

        {/* Route waypoint markers */}
        {route && route.path.slice(1, -1).map((node, index) => (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={new Icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMzMzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIvPjwvc3ZnPg==',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
              popupAnchor: [0, -6],
            })}
          >
            <Popup>
              <div className="text-center">
                <p className="text-xs font-medium">{node.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Selection mode indicator */}
      {selectionMode && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-[1000]">
          <p className="text-sm font-medium">
            Click on the map to select {selectionMode === 'source' ? 'source' : 'destination'} location
          </p>
        </div>
      )}
    </div>
  );
}
