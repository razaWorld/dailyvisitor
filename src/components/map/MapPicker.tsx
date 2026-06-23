'use client';

import { useState } from 'react';
import type { MapPoint } from '@/src/types/database';

// Dummy replacement for the old Leaflet-based marker type.
// Adjust fields as needed once you wire up a real map provider.
export interface NearbyMarker {
  id: string;
  point: MapPoint;
  label?: string;
}

interface MapPickerProps {
  initialCenter?: MapPoint;
  initialSelected?: MapPoint | null;
  onChange?: (point: MapPoint) => void;
  nearby?: NearbyMarker[];
  height?: string;
  readOnly?: boolean;
}

const DEFAULT_CENTER: MapPoint = { lat: 33.5651, lng: 73.0169 }; // Rawalpindi fallback

/**
 * Reusable location picker for the whole app.
 *
 * - Pass `onChange` to let the user set coordinates (signup,
 *   address forms, visitor profile).
 * - Pass `nearby` to render provider markers (currently unused —
 *   map rendering has been removed; wire up a replacement map provider here).
 */
export default function MapPicker({
  initialCenter = DEFAULT_CENTER,
  initialSelected = null,
  onChange,
  nearby = [],
  height = '400px',
  readOnly = false,
}: MapPickerProps) {
  const [selected, setSelected] = useState<MapPoint | null>(initialSelected);

  const handleSelect = (point: MapPoint) => {
    if (readOnly) return;
    setSelected(point);
    onChange?.(point);
  };

  const current = selected ?? initialCenter;

  return (
    <div className="space-y-2">
      <div
        style={{ height }}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center gap-3 p-4"
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Map disabled. Enter coordinates manually.
        </p>
        {!readOnly ? (
          <div className="flex gap-2">
            <input
              type="number"
              step="0.0001"
              value={current.lat}
              onChange={(e) =>
                handleSelect({ ...current, lat: parseFloat(e.target.value) || 0 })
              }
              className="w-28 rounded-md border px-2 py-1 text-sm dark:bg-zinc-900"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="0.0001"
              value={current.lng}
              onChange={(e) =>
                handleSelect({ ...current, lng: parseFloat(e.target.value) || 0 })
              }
              className="w-28 rounded-md border px-2 py-1 text-sm dark:bg-zinc-900"
              placeholder="Longitude"
            />
          </div>
        ) : (
          <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
            {current.lat.toFixed(4)}, {current.lng.toFixed(4)}
          </p>
        )}
      </div>
      {!readOnly && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Enter latitude and longitude to set the location.
        </p>
      )}
    </div>
  );
}