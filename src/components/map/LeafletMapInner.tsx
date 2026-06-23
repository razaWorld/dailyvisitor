'use client';

import { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from '@/src/types/database';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const providerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  className: 'provider-marker',
});

export interface NearbyMarker extends MapPoint {
  id: number | string;
  label: string;
  distanceKm?: number;
}

interface LeafletMapInnerProps {
  center: MapPoint;
  zoom?: number;
  selected?: MapPoint | null;
  onSelect?: (point: MapPoint) => void;
  nearby?: NearbyMarker[];
  height?: string;
}

function ClickHandler({ onSelect }: { onSelect?: (point: MapPoint) => void }) {
  useMapEvents({
    click(e) {
      onSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LeafletMapInner({
  center,
  zoom = 13,
  selected,
  onSelect,
  nearby = [],
  height = '400px',
}: LeafletMapInnerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={(node) => {
        if (node && (node as any)._leaflet_id) {
          (node as any)._leaflet_id = null;
        }
        containerRef.current = node;
      }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height, width: '100%', borderRadius: '0.75rem' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onSelect && <ClickHandler onSelect={onSelect} />}

        {selected && (
          <Marker position={[selected.lat, selected.lng]} icon={defaultIcon}>
            <Popup>Selected location</Popup>
          </Marker>
        )}

        {nearby.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={providerIcon}>
            <Popup>
              {point.label}
              {point.distanceKm !== undefined && (
                <div className="text-xs text-zinc-500">{point.distanceKm.toFixed(1)} km away</div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}