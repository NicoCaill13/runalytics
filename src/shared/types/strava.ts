// Types minimaux pour /athlete/activities (Strava v3)

export type SportType = 'Run' | 'TrailRun' | 'Hike' | 'Walk' | 'VirtualRun';
export type HeartRateStatus = 'none' | 'partial' | 'ready';

export interface StravaActivity {
  id: number;
  name: string;
  start_date: string; // ISO UTC
  start_date_local: string; // ISO local
  distance: number; // mètres
  moving_time: number; // secondes
  elapsed_time: number; // secondes
  total_elevation_gain: number; // mètres
  type: string; // champ legacy
  sport_type: SportType; // champ moderne
  has_heartrate?: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number; // strides/min ÷ 2 chez Strava (tests à vérifier)
  average_speed?: number; // m/s
  max_speed?: number; // m/s
  private?: boolean;
}

export type StravaActivitiesResponse = StravaActivity[];

export type Zones = Record<'z1' | 'z2' | 'z3' | 'z4' | 'z5', { min: number; max: number }>;
export type CoachPersonality = 'COOL' | 'MODERATE' | 'COMPET';
export type Sex = 'M' | 'F' | undefined;
export type VmaSource = '10k_race' | '5k_race' | 'tempo' | 'best_20_30';
