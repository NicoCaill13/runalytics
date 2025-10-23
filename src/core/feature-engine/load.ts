import { Activity } from '@/types/activity';
import { HeartRateStatus } from '@/types/strava';

interface LoadContext {
  heartRateStatus: HeartRateStatus;
  hrRef?: number;
  refPace?: number;
}

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));

export function computeSessionLoad(activity: Activity, ctx: LoadContext): number {
  const movingTime_h = activity.movingTimeS > 0 ? activity.movingTimeS / 3600 : 0;
  if (movingTime_h === 0) return 0;

  const hrRef = ctx.hrRef ?? 170; // V1: ref générique, personnalisable ensuite
  const refPace = ctx.refPace ?? 2.8;

  // FC “fiable” uniquement si statut ready ET avgHr présent
  if (ctx.heartRateStatus === 'ready' && typeof activity.avgHr === 'number') {
    const hrRatio = clamp(activity.avgHr / hrRef, 0.7, 1.3);
    return movingTime_h * hrRatio * 100;
  }

  // Fallback mécanique (vitesse relative)
  const paceMps = activity.movingTimeS > 0 ? activity.distanceM / activity.movingTimeS : 0;
  const intensity = clamp(paceMps / refPace, 0.7, 1.5);
  return movingTime_h * intensity * 100;
}
