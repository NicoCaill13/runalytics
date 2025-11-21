// src/activities/rolling-best/rolling-best.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';

@Injectable()
export class RollingBestService {
  private readonly logger = new Logger(RollingBestService.name);

  constructor(private readonly prisma: PrismaService) { }

  async updateForActivity(activityId: string): Promise<void> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { stream: true },
    });

    if (!activity || !activity.stream) {
      return;
    }

    const best6 = this.computeBest6MinWindow(activity.stream);
    if (!best6) {
      return;
    }

    await this.prisma.activityRollingBest.upsert({
      where: { activityId: activity.id },
      create: {
        activityId: activity.id,
        userId: activity.userId,

        startOffsetS360: best6.startOffsetS,
        endOffsetS360: best6.endOffsetS,
        distanceM360: best6.distanceM,
        speedMps360: best6.speedMps,
        avgHr360: best6.avgHr ?? undefined,
        dPlusM360: best6.dPlusM ?? undefined,

        // bonus : on peut aussi remplir la moyenne activité si tu veux
        averageSpeedMps: activity.movingTimeSec > 0 ? activity.distanceM / activity.movingTimeSec : undefined,
        averageSpeedKmh: activity.movingTimeSec > 0 ? (activity.distanceM / activity.movingTimeSec) * 3.6 : undefined,
      },
      update: {
        startOffsetS360: best6.startOffsetS,
        endOffsetS360: best6.endOffsetS,
        distanceM360: best6.distanceM,
        speedMps360: best6.speedMps,
        avgHr360: best6.avgHr ?? undefined,
        dPlusM360: best6.dPlusM ?? undefined,
        averageSpeedMps: activity.movingTimeSec > 0 ? activity.distanceM / activity.movingTimeSec : undefined,
        averageSpeedKmh: activity.movingTimeSec > 0 ? (activity.distanceM / activity.movingTimeSec) * 3.6 : undefined,
      },
    });
  }

  private computeBest6MinWindow(stream: { timeSec: any; distanceM: any; heartRate?: any; altitudeM?: any }) {
    const time: number[] = stream.timeSec ?? [];
    const dist: number[] = stream.distanceM ?? [];
    const hr: number[] = stream.heartRate ?? [];
    const alt: number[] = stream.altitudeM ?? [];

    if (!time.length || !dist.length || time.length !== dist.length) {
      return null;
    }

    const n = time.length;
    const windowSec = 360;

    let bestSpeed = 0;
    let bestStartIndex = -1;
    let bestEndIndex = -1;

    let j = 0;

    for (let i = 0; i < n; i++) {
      const startT = time[i];

      while (j < n && time[j] - startT < windowSec) {
        j++;
      }
      if (j >= n) break;

      const deltaDist = dist[j] - dist[i];
      if (deltaDist <= 0) continue;

      const speedMps = deltaDist / windowSec;

      if (speedMps > bestSpeed) {
        bestSpeed = speedMps;
        bestStartIndex = i;
        bestEndIndex = j;
      }
    }

    if (bestSpeed <= 0 || bestStartIndex < 0 || bestEndIndex <= bestStartIndex) {
      return null;
    }

    const startOffsetS = time[bestStartIndex];
    const endOffsetS = time[bestEndIndex];
    const distanceM = Math.round(dist[bestEndIndex] - dist[bestStartIndex]);

    // moyenne FC sur la fenêtre
    let avgHr: number | null = null;
    if (hr.length === time.length) {
      const slice = hr.slice(bestStartIndex, bestEndIndex + 1);
      const sum = slice.reduce((s, v) => s + v, 0);
      avgHr = Math.round(sum / slice.length);
    }

    // D+ sur la fenêtre
    let dPlusM: number | null = null;
    if (alt.length === time.length) {
      let dPlus = 0;
      for (let k = bestStartIndex + 1; k <= bestEndIndex; k++) {
        const diff = alt[k] - alt[k - 1];
        if (diff > 0) dPlus += diff;
      }
      dPlusM = Math.round(dPlus);
    }

    return {
      speedMps: bestSpeed,
      startOffsetS,
      endOffsetS,
      distanceM,
      avgHr,
      dPlusM,
    };
  }
}
