import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { startOfIsoWeek, getIsoWeekYear, monotony, strain } from '@/core/feature-engine/week-utils';

@Injectable()
export class WeeklyFeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForUser(userId: string, since?: Date) {
    // 1) Récup activités (runs) depuis 'since' (sinon tout)
    const where: any = { userId };
    if (since) where.dateUtc = { gte: since };

    const acts = await this.prisma.activity.findMany({
      where,
      select: {
        dateUtc: true,
        distanceM: true,
        movingTimeS: true,
        elevGainM: true,
        load: true,
      },
      orderBy: { dateUtc: 'asc' },
    });
    if (!acts.length) return { userId, weeksComputed: 0 };

    // 2) Group by ISO week
    type WeekAgg = {
      year: number;
      weekNumber: number;
      weekStart: Date;
      runsCount: number;
      daysActive: number;
      distanceKm: number;
      movingTimeH: number;
      elevGainM: number;
      loadWeek: number;
      dayLoads: Record<number, number>;
    };
    const weeks = new Map<string, WeekAgg>();

    for (const a of acts) {
      const d = new Date(a.dateUtc);
      const ws = startOfIsoWeek(d);
      const { year, weekNumber } = getIsoWeekYear(d);
      const key = `${year}-${weekNumber}`;

      if (!weeks.has(key)) {
        weeks.set(key, {
          year,
          weekNumber,
          weekStart: ws,
          runsCount: 0,
          daysActive: 0,
          distanceKm: 0,
          movingTimeH: 0,
          elevGainM: 0,
          loadWeek: 0,
          dayLoads: {},
        });
      }
      const w = weeks.get(key)!;
      w.runsCount += 1;
      w.distanceKm += a.distanceM / 1000;
      w.movingTimeH += a.movingTimeS / 3600;
      w.elevGainM += a.elevGainM ?? 0;
      w.loadWeek += a.load ?? 0;

      const dow = d.getUTCDay() || 7; // 1..7
      w.dayLoads[dow] = (w.dayLoads[dow] ?? 0) + (a.load ?? 0);
    }

    // 3) daysActive + monotony/strain
    const ordered = [...weeks.values()].sort((a, b) => +a.weekStart - +b.weekStart);
    for (const w of ordered) {
      w.daysActive = Object.keys(w.dayLoads).length;
    }

    // 4) ACWR nécessite historique des 4 semaines précédentes
    const withMetrics = ordered.map((w, idx, arr) => {
      const mono = monotony(Object.values(w.dayLoads));
      const str = strain(w.loadWeek, mono);

      // chronic = moyenne des 4 semaines précédentes
      const prev = arr.slice(Math.max(0, idx - 4), idx);
      const validPrev = prev.filter((p) => p.daysActive >= 2);
      const chronic = validPrev.length >= 2 ? validPrev.reduce((s, p) => s + p.loadWeek, 0) / validPrev.length : null;
      const acwr = chronic && chronic > 0 ? Math.min(2.5, w.loadWeek / chronic) : null;

      return { ...w, monotony: mono ?? null, strain: str ?? null, acwr };
    });

    // 5) Upsert
    for (const w of withMetrics) {
      await this.prisma.weeklyFeatures.upsert({
        where: { userId_year_weekNumber: { userId, year: w.year, weekNumber: w.weekNumber } },
        update: {
          weekStart: w.weekStart,
          runsCount: w.runsCount,
          daysActive: w.daysActive,
          distanceKm: +w.distanceKm.toFixed(2),
          movingTimeH: +w.movingTimeH.toFixed(2),
          elevGainM: Math.round(w.elevGainM),
          loadWeek: +w.loadWeek.toFixed(1),
          monotony: w.monotony ? +w.monotony.toFixed(2) : null,
          strain: w.strain ? +w.strain.toFixed(1) : null,
          acwr: w.acwr ? +w.acwr.toFixed(2) : null,
        },
        create: {
          userId,
          year: w.year,
          weekNumber: w.weekNumber,
          weekStart: w.weekStart,
          runsCount: w.runsCount,
          daysActive: w.daysActive,
          distanceKm: +w.distanceKm.toFixed(2),
          movingTimeH: +w.movingTimeH.toFixed(2),
          elevGainM: Math.round(w.elevGainM),
          loadWeek: +w.loadWeek.toFixed(1),
          monotony: w.monotony ? +w.monotony.toFixed(2) : null,
          strain: w.strain ? +w.strain.toFixed(1) : null,
          acwr: w.acwr ? +w.acwr.toFixed(2) : null,
        },
      });
    }

    return { userId, weeksComputed: withMetrics.length };
  }

  async list(userId: string, from?: Date, to?: Date) {
    const where: any = { userId };
    if (from || to)
      where.weekStart = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    return this.prisma.weeklyFeatures.findMany({
      where: { userId, year: 2025 },
      orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
    });
  }
}
