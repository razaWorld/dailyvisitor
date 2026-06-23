'use client';

import { useState } from 'react';
import MapPicker from '@/src/components/map/MapPicker';
import { useNearbyVisitors } from '@/src/lib/hooks/useNearbyVisitors';
import type { MapPoint } from '@/src/types/database';

export default function NearbyVisitorsPage() {
  const [center, setCenter] = useState<MapPoint | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);

  const { visitors, loading, error } = useNearbyVisitors(
    center?.lat ?? null,
    center?.lng ?? null,
    radiusKm
  );

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Nearby Providers</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Radius: {radiusKm} km
          </label>
          <input
            type="range"
            min={1}
            max={25}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
          <button
            onClick={detectLocation}
            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📍 Use my location
          </button>
        </div>
      </div>

      <MapPicker
        initialCenter={center ?? undefined}
        initialSelected={center}
        onChange={setCenter}
        nearby={visitors.map((v) => ({
          id: v.visitor_profile_id,
          lat: v.lat,
          lng: v.long,
          label: `${v.name} • ★ ${v.rating_avg.toFixed(1)}`,
          distanceKm: v.distance_km,
        }))}
        height="450px"
      />

      {loading && <p className="text-sm text-zinc-500">Searching nearby providers…</p>}
      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      {!loading && center && visitors.length === 0 && (
        <p className="text-sm text-zinc-500">No approved providers within {radiusKm} km yet.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {visitors.map((v) => (
          <div
            key={v.visitor_profile_id}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          >
            <p className="font-semibold text-zinc-900 dark:text-white">{v.name}</p>
            <p className="text-sm text-zinc-500">
              {v.distance_km.toFixed(1)} km away • ★ {v.rating_avg.toFixed(1)}
            </p>
            <span
              className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                v.is_available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {v.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
