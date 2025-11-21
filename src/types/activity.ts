export interface Activity {
  provider: 'strava';
  providerActivityId: string;
  dateUtc: string;
  dateLocal: string;
  distanceM: number;
  movingTimeS: number;
  elevGainM: number;
  sport: 'run' | 'trail' | 'walk' | 'hike' | 'other';
  avgHr?: number;
  maxHr?: number;
  avgCadenceSpm?: number; // en pas/min
  avgPaceSecPerKm?: number;
}

export function isRunSport(sport: string) {
  return sport === 'Run' || sport === 'TrailRun' || sport === 'VirtualRun';
}

export function mapStravaToDomain(a: import('./strava').StravaActivity): Activity {
  const paceSecPerKm = a.average_speed && a.average_speed > 0 ? 1000 / a.average_speed : undefined;

  // Strava average_cadence (running) est souvent en "steps/min / 2" => on multiplie par 2
  const cadenceSpm = a.average_cadence ? Math.round(a.average_cadence * 2) : undefined;

  return {
    provider: 'strava',
    providerActivityId: String(a.id),
    dateUtc: a.start_date,
    dateLocal: a.start_date_local,
    distanceM: a.distance,
    movingTimeS: a.moving_time,
    elevGainM: a.total_elevation_gain,
    sport:
      a.sport_type === 'Run'
        ? 'run'
        : a.sport_type === 'TrailRun'
          ? 'trail'
          : a.sport_type === 'Walk'
            ? 'walk'
            : a.sport_type === 'Hike'
              ? 'hike'
              : 'other',
    avgHr: a.average_heartrate,
    maxHr: a.max_heartrate,
    avgCadenceSpm: cadenceSpm,
    avgPaceSecPerKm: paceSecPerKm,
  };
}

export type StravaStreamObj = {
  data: number[];
  series_type: 'time' | 'distance';
  resolution: 'low' | 'medium' | 'high';
  original_size: number;
};
export type StravaStreamMap = {
  time: StravaStreamObj;
  distance: StravaStreamObj;
  altitude?: StravaStreamObj;
  heartrate?: StravaStreamObj;
};

export type Stream = {
  t: { data: number[] };
  d: { data: number[] };
};

export type Point = { t: number; dist: number; elev?: number; hr?: number };

export function mapStreamsToPoints(stream: StravaStreamMap): Point[] {
  const time = stream.time?.data;
  const distance = stream?.distance?.data;
  const altitude = stream?.altitude?.data;
  const heartrate = stream?.heartrate?.data;

  if (distance === undefined) {
    return [{ t: 0, dist: 0, elev: 0, hr: 0 }];
  }

  const n = Math.min(time.length, distance.length, altitude?.length ?? Infinity, heartrate?.length ?? Infinity);
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) pts.push({ t: time[i], dist: distance[i], elev: altitude?.[i], hr: heartrate?.[i] });
  // monotonie distance
  for (let i = 1; i < pts.length; i++) if (pts[i].dist < pts[i - 1].dist) pts[i].dist = pts[i - 1].dist;
  return pts;
}

export function isIntervalWorkout(streams): boolean {
  const { time, distance } = streams;
  if (!time?.data?.length || !distance?.data?.length) return false;

  const speeds: number[] = [];
  for (let i = 1; i < time.data.length; i++) {
    const dt = time.data[i] - time.data[i - 1];
    const dd = distance.data[i] - distance.data[i - 1];
    if (dt > 0 && dd >= 0) speeds.push(dd / dt);
  }

  if (speeds.length < 20) return false;
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const std = Math.sqrt(speeds.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / speeds.length);
  const cv = std / mean;

  // 3️⃣ Détection de répétitions rapides
  const threshold = 1.15 * mean;
  let streak = 0;
  let peaks = 0;

  for (let i = 0; i < speeds.length; i++) {
    if (speeds[i] > threshold) {
      streak++;
    } else {
      if (streak >= 20) peaks++;
      streak = 0;
    }
  }

  return cv > 0.15 && peaks >= 3;
}

export function bestWindow(pts: Point[], windowSec: number, maxDplus = 9999) {
  if (pts.length < 2) return null;
  let best = { v: 0, i0: 0, i1: 0, dplus: 0, avgHr: undefined as number | undefined };

  let j = 0,
    sumHr = 0,
    cntHr = 0;
  for (let i = 0; i < pts.length; i++) {
    while (j < pts.length && pts[j].t - pts[i].t < windowSec) {
      if (pts[j].hr != null) {
        sumHr += pts[j].hr!;
        cntHr++;
      }
      j++;
    }
    if (j <= i) continue;

    const dt = pts[j - 1].t - pts[i].t;
    if (dt < windowSec - 3) continue;

    const dd = pts[j - 1].dist - pts[i].dist;
    if (dd <= 0) continue;

    let dplus = 0;
    if (pts[0].elev != null) {
      dplus = Math.max(0, pts[j - 1].elev! - pts[i].elev!);
      if (dplus > maxDplus) continue;
    }

    const v = dd / dt;
    if (v > best.v) {
      best = { v, i0: i, i1: j - 1, dplus, avgHr: cntHr ? Math.round(sumHr / cntHr) : undefined };
    }

    if (pts[i].hr != null) {
      sumHr -= pts[i].hr!;
      cntHr--;
    }
  }
  if (best.v <= 0) return null;
  return best;
}

export function computeVmaMs(b6, b7) {
  let average: number | null;
  if (b6 && b7) {
    average = (b6.v + b7.v) / 2;
  } else if (b6 && !b7) {
    average = b6.v;
  } else if (!b6 && b7) {
    average = b7.v;
  } else {
    average = null;
  }
  return average;
}
