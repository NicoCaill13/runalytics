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
