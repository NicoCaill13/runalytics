import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { computeHrZones, pct } from '@/core/hr/hr-utils';
import { Sex } from '@/shared/types/strava';

@Injectable()
export class HrProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private estimateFcmByAge(age?: number, sex?: Sex): number {
    if (!age || age < 12 || age > 85) return 190;
    const base = 208 - 0.7 * age; // Tanaka
    const adj = sex === 'F' ? 2 : 0;
    return Math.round(base + adj);
  }

  private estimateRestHr(avgHrs: number[]): number | null {
    if (!avgHrs.length) return null;
    const lows = avgHrs
      .slice()
      .sort((a, b) => a - b)
      .slice(0, Math.max(3, Math.floor(avgHrs.length * 0.15)));
    const m = pct(lows, 0.5);
    if (m == null) return null;
    return Math.round(Math.max(40, Math.min(80, m)));
    // clamp 40..80 bpm
  }

  async rebuild(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const acts = await this.prisma.activity.findMany({
      where: { userId },
      select: { avgHr: true, maxHr: true },
      orderBy: { dateUtc: 'desc' },
      take: 500,
    });

    const maxHrs = acts.map((a) => a.maxHr ?? null).filter((n): n is number => n != null && n >= 120);
    const avgHrs = acts.map((a) => a.avgHr ?? null).filter((n): n is number => n != null && n >= 60);

    const observedFcm = maxHrs.length ? Math.max(pct(maxHrs, 0.99) ?? 0, Math.max(...maxHrs)) : null;
    const fcm = observedFcm && observedFcm >= 150 ? Math.round(observedFcm) : this.estimateFcmByAge(user.age ?? undefined, user.sex as Sex);

    const fcrepos = user.fcrepos ?? this.estimateRestHr(avgHrs) ?? (user.sex === 'F' ? 60 : 55);
    const zones = computeHrZones(fcm, fcrepos);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fcm,
        fcrepos,
        zones: zones as any,
        hrUpdatedAt: new Date(),
      },
    });

    return { fcm, fcrepos, zones, source: observedFcm ? 'observed' : 'age_formula' };
  }
}
