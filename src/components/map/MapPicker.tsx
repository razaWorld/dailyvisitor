'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { MapPoint } from '@/src/types/database';
import type { NearbyMarker } from './LeafletMapInner';

// Leaflet touches `window`, so it must never run during SSR/static build.
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-sm text-zinc-400">
      Loading map…
    </div>
  ),
});

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
 * Reusable map component for the whole app.
 *
 * - Pass `onChange` to let the user pick coordinates by clicking (signup,
 *   address forms, visitor profile).
 * - Pass `nearby` to render provider markers (customer "nearby visitors" view).
 * - Always client-rendered only; safe to use inside Server Components.
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

  return (
    <div className="space-y-2">
      <LeafletMapInner
        center={selected ?? initialCenter}
        selected={selected}
        onSelect={readOnly ? undefined : handleSelect}
        nearby={nearby}
        height={height}
      />
      {!readOnly && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Click anywhere on the map to set the location.
        </p>
      )}
    </div>
  );
}
