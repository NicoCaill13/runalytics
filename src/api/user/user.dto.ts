export interface UserResponseDto {
  user: {
    id: string;
    username: string | null;
    sex: 'M' | 'F' | null;
    profile: string | null;
    profileMedium: string | null;
    city: string | null;
    country: string | null;
    measurementPref: 'meters' | 'feet' | null;
    coachPersonality: 'COOL' | 'MODERATE' | 'COMPET' | null;
    runnerType: 'PLEASURE' | 'PROGRESS' | 'COMPETITOR' | null;
  };
  hrProfile: {
    fcm: number | null;
    fcrepos: number | null;
    heartRateStatus: string | null;
    zones: Record<string, { min: number; max: number }> | null;
  };
  vma: {
    mps: number | null;
    kph: number | null;
    pacePerKm: string | null;
    updatedAt: string | null;
  };
  training: {
    year: number | null;
    weekNumber: number | null;
    loadWeek: number | null;
    acwr: number | null;
    monotony: number | null;
    distanceKm: number | null;
    scoreGlobal: number | null;
  };
  thresholds: {
    loadWeek: { p50: number; p75: number };
    acwr: { p50: number; p75: number };
    day: { p50: number; p75: number; p90: number };
  } | null;
  insights: string[];
}
