'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import type { NearbyVisitor } from '@/src/types/database';

export function useNearbyVisitors(lat: number | null, long: number | null, radiusKm = 5) {
  const [visitors, setVisitors] = useState<NearbyVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || long === null) return;

    let active = true;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    supabase
      .rpc('nearby_visitors', { in_lat: lat, in_long: long, radius_km: radiusKm })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setVisitors((data as NearbyVisitor[]) ?? []);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lat, long, radiusKm]);

  return { visitors, loading, error };
}
