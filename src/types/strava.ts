import { Prisma } from '@prisma/client';

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

export type CoachPersonality = 'COOL' | 'MODERATE' | 'COMPET';
export type Sex = 'M' | 'F' | undefined;

export const kphToMps = (kph: number) => Math.round((kph / 3.6) * 10) / 10;
export const mpsToKph = (mps: number) => Math.round(mps * 3.6 * 10) / 10;
export const mphToMps = (mph: number) => mph * 0.44704;
export const mpsToMph = (mps: number) => mps / 0.44704;
export const kphToPaceStr = (kph: number): string => {
  if (!kph) return '-';
  const sPerKm = Math.round(3600 / kph);
  const m = Math.floor(sPerKm / 60);
  const s = (sPerKm % 60).toString().padStart(2, '0');
  return `${m}:${s}/km`;
};

export const percentVmaToKph = (percent: number, vmaMps: number): number => mpsToKph(vmaMps * percent);

export type Sample = {
  t: number; // timestamp (ms since epoch) ou offset (s)
  dist: number; // distance cumulée (m)
  elev?: number; // altitude (m)
  hr?: number; // bpm
  cadence?: number; // spm
  gradeAdjSpeed?: number; // m/s, si déjà calculé (GAP)
};

export type Run = {
  id: string;
  startDate: Date;
  samples: Sample[]; // échantillons triés par t
};

export type VMAOpts = {
  windowMinSec?: number; // 180 par défaut
  windowMaxSec?: number; // 360 par défaut
  useGAP?: boolean; // vrai si tu as une GAP fiable
  fcm?: number; // FC max pour filtrer HR
  hrPctMin?: number; // 0.92 -> 92%
  cadenceMin?: number; // 160 spm
};

export type ARBRow = {
  activity: { dateUtc: Date };
  startOffsetS360: number | null;
  endOffsetS360: number | null;
  speedMps360: Prisma.Decimal | null;
  startOffsetS720: number | null;
  endOffsetS720: number | null;
  speedMps720: Prisma.Decimal | null;
};

export const decToNum = (d: Prisma.Decimal | null): number | null => (d === null || d === undefined ? null : Number(d));
