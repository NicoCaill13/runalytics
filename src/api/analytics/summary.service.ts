import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { ThresholdsService } from './thresholds.service';

@Injectable()
export class SummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly thresholds: ThresholdsService,
  ) {}

  async getSummary(userId: string) {
    const weeks = await this.prisma.weeklyFeatures.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: 12,
    });

    if (!weeks.length) return { message: 'No weekly data yet' };

    const avg = (arr: number[]): number => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const numeric = (x: number | null | undefined): number => x ?? 0;

    const recent = weeks[0];
    const oldest = weeks[weeks.length - 1];

    const summary = {
      averages: {
        loadWeek: +avg(weeks.map((w) => numeric(w.loadWeek))).toFixed(1),
        acwr: +avg(weeks.map((w) => numeric(w.acwr))).toFixed(2),
        distanceKm: +avg(weeks.map((w) => numeric(w.distanceKm))).toFixed(1),
        monotony: +avg(weeks.map((w) => numeric(w.monotony))).toFixed(2),
        strain: +avg(weeks.map((w) => numeric(w.strain))).toFixed(1),
      },
      trends: {
        load: numeric(recent.loadWeek) > numeric(oldest.loadWeek) ? 'up' : 'down',
        acwr: numeric(recent.acwr) > numeric(oldest.acwr) ? 'up' : 'down',
        strain: numeric(recent.strain) > numeric(oldest.strain) ? 'up' : 'down',
      },
    };

    // Get thresholds for context
    const thresholds = await this.thresholds.forUser(userId);

    // 🔹 Type explicite pour insights
    const insights: string[] = [];

    if (summary.averages.monotony > 2.5) {
      insights.push("Ta monotonie moyenne est élevée : varie davantage l'intensité.");
    }
    if (summary.averages.acwr > 1.3) {
      insights.push('Ta charge augmente vite : planifie une semaine plus légère.');
    }
    if (summary.averages.loadWeek < thresholds.loadWeek.p50) {
      insights.push(`Tu pourrais augmenter ta charge progressivement vers ton p50 (~${thresholds.loadWeek.p50.toFixed(0)} AU).`);
    }

    const norm = (x: number, min: number, max: number) => Math.max(0, Math.min(1, 1 - Math.abs(x - (min + max) / 2) / ((max - min) / 2)));

    const loadScore = norm(summary.averages.loadWeek, thresholds.loadWeek.p50, thresholds.loadWeek.p75);
    const acwrScore = norm(summary.averages.acwr, 0.8, 1.3);
    const monoScore = norm(summary.averages.monotony, 1.3, 2.0);

    const scoreGlobal = Math.round((loadScore * 0.4 + acwrScore * 0.4 + monoScore * 0.2) * 100);

    return {
      ...summary,
      thresholds,
      insights,
      scoreGlobal,
    };
  }
}
