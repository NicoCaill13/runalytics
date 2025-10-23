import { Zones } from '@/types/strava';

export function computeHrZones(fcm: number, fcr: number): Zones {
  const res = fcm - fcr;
  const bands: Record<keyof Zones, [number, number]> = {
    z1: [0.5, 0.6],
    z2: [0.6, 0.7],
    z3: [0.7, 0.8],
    z4: [0.8, 0.9],
    z5: [0.9, 1.0],
  };
  const z = {} as Zones;
  (Object.keys(bands) as (keyof Zones)[]).forEach((k) => {
    const [a, b] = bands[k];
    z[k] = { min: Math.round(fcr + res * a), max: Math.round(fcr + res * b) };
  });
  return z;
}

export function pct(values: number[], p: number): number | null {
  const a = values.slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const idx = (a.length - 1) * p;
  const lo = Math.floor(idx),
    hi = Math.ceil(idx);
  return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (idx - lo);
}
