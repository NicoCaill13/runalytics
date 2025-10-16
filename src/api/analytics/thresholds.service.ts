import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';

type Percentiles = { p50: number; p75: number; p90?: number };

function pct(arr: number[], p: number): number | null {
  const a = arr.slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const idx = (a.length - 1) * p;
  const lo = Math.floor(idx),
    hi = Math.ceil(idx);
  if (lo === hi) return a[lo];
  return a[lo] + (a[hi] - a[lo]) * (idx - lo);
}

@Injectable()
export class ThresholdsService {
  constructor(private readonly prisma: PrismaService) {}

  async forUser(userId: string) {
    const weeks = await this.prisma.weeklyFeatures.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      take: 12,
    });

    const loadWeeks = weeks.map((w) => w.loadWeek).filter((n) => typeof n === 'number');
    const acwrs = weeks.map((w) => w.acwr ?? null).filter((n): n is number => n != null);
    const maxDays = weeks.map((w) => w.maxDayLoad ?? null).filter((n): n is number => n != null);

    const loadWeek: Percentiles = {
      p50: pct(loadWeeks, 0.5) ?? 0,
      p75: pct(loadWeeks, 0.75) ?? 0,
    };
    const acwr: Percentiles = {
      p50: pct(acwrs, 0.5) ?? 0,
      p75: pct(acwrs, 0.75) ?? 0,
    };
    const day: Percentiles = {
      p50: pct(maxDays, 0.5) ?? 0,
      p75: pct(maxDays, 0.75) ?? 0,
      p90: pct(maxDays, 0.9) ?? 0,
    };

    return { loadWeek, acwr, day };
  }
}
