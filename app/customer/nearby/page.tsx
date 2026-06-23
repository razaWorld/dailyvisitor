'use client';

import { useState } from 'react';
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
    <div className="min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-400/20 dark:bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Nearby Providers</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Find available visitors around you</p>
          </div>
          <div className="flex items-center gap-3 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 rounded-2xl px-4 py-2.5 shadow-md shadow-zinc-900/5 dark:shadow-black/30">
            <label className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
              Radius: <span className="font-semibold text-violet-600 dark:text-violet-400">{radiusKm} km</span>
            </label>
            <input
              type="range"
              min={1}
              max={25}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="accent-violet-600"
            />
            <button
              onClick={detectLocation}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              📍 Use my location
            </button>
          </div>
        </div>

        {/* Map disabled — dummy placeholder until a map provider is wired up */}
        <div
          style={{ height: '450px' }}
          className="w-full rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 dark:shadow-black/30 flex flex-col items-center justify-center gap-2 p-4"
        >
          <span className="text-2xl mb-1">🗺️</span>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Map disabled</p>
          {center ? (
            <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
              {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </p>
          ) : (
            <p className="text-xs text-zinc-400">Use the &quot;Use my location&quot; button to set a position</p>
          )}
        </div>

        {loading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
            Searching nearby providers…
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && center && visitors.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No approved providers within {radiusKm} km yet.</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {visitors.map((v) => (
            <div
              key={v.visitor_profile_id}
              className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 shadow-md shadow-zinc-900/5 dark:shadow-black/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            >
              <p className="font-semibold text-zinc-900 dark:text-white">{v.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {v.distance_km.toFixed(1)} km away • ★ {v.rating_avg.toFixed(1)}
              </p>
              <span
                className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  v.is_available
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {v.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}