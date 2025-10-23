import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { VmaEstimateDto, mpsToKph, kphToPaceStr, ARBRow } from '@/types/strava';
import { run } from 'node:test';

@Injectable()
export class VmaService {
  constructor(private readonly prisma: PrismaService) {}

  private async getVmaCutoff(userId: string): Promise<Date | undefined> {
    const last = await this.prisma.physioHistory.findFirst({
      where: { userId, metric: 'VMA', source: 'ESTIMATED' },
      orderBy: { createdAt: 'desc' },
      select: { windowEnd: true, createdAt: true },
    });
    return last ? (last.windowEnd ?? last.createdAt) : undefined;
  }

  private async loadRollingBestsSince(userId: string, cutoff?: Date) {
    return await this.prisma.activityRollingBest.findMany({
      where: {
        userId,
        activity: {
          is: {
            ...(cutoff ? { dateUtc: { gt: cutoff } } : {}),
            OR: [{ type: { not: 'VMA' } }, { type: null }],
          },
        },
      },
      include: { activity: { select: { dateUtc: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private pickBestCandidate(rows: ARBRow[]) {
    let best: {
      speedMs: number;
      windowSec: 360 | 720;
      startDate: Date;
      startOffsetS: number;
      endOffsetS: number;
    } | null = null;

    for (const r of rows) {
      const cand360 =
        r.speedMps360 != null
          ? {
              speedMs: Number(r.speedMps360),
              windowSec: 360 as const,
              startDate: r.activity.dateUtc,
              startOffsetS: r.startOffsetS360!,
              endOffsetS: r.endOffsetS360!,
            }
          : null;

      const cand720 =
        r.speedMps720 != null
          ? {
              speedMs: Number(r.speedMps720),
              windowSec: 720 as const,
              startDate: r.activity.dateUtc,
              startOffsetS: r.startOffsetS720!,
              endOffsetS: r.endOffsetS720!,
            }
          : null;

      for (const c of [cand360, cand720]) {
        if (!c) continue;
        if (!best || c.speedMs > best.speedMs) best = c;
      }
    }
    return best;
  }

  async estimateFromActivities(userId: string): Promise<VmaEstimateDto> {
    const cutoff = await this.getVmaCutoff(userId);
    const runs = await this.loadRollingBestsSince(userId, cutoff);
    if (!runs.length) throw new NotFoundException('No activities');

    const last = runs.pop();
    const first = runs.shift();

    const best = this.pickBestCandidate(runs);
    if (!best) throw new NotFoundException('No activities');

    return {
      vmaMps: best.speedMs,
      vmaKph: mpsToKph(best.speedMs),
      pacePerKm: kphToPaceStr(mpsToKph(best.speedMs)),
      source: 'ESTIMATED',
      confidence: 0.5,
      firstRun: first?.activity?.dateUtc,
      lastRun: last?.activity?.dateUtc,
      runsCount: runs.length,
    };
  }

  async currentOrEstimate(userId: string): Promise<VmaEstimateDto> {
    return this.estimateFromActivities(userId);
  }

  async estimateAndPersist(userId: string): Promise<VmaEstimateDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException();
    }

    const est = await this.estimateFromActivities(userId);
    if (!est) {
      throw new NotFoundException();
    }
    const estimation = await this.prisma.physioHistory.findFirst({
      where: {
        userId: userId,
        metric: 'VMA',
        windowStart: new Date(est.firstRun),
        windowEnd: new Date(est.lastRun),
      },
    });
    if (estimation) {
      throw new BadRequestException('This VMA already exist', {
        cause: new Error(),
        description: `Date range ${estimation.windowStart} - ${estimation.windowEnd} already exists`,
      });
    }
    await this.prisma.physioHistory.create({
      data: {
        userId: userId,
        metric: 'VMA',
        value: mpsToKph(est.vmaMps),
        source: 'ESTIMATED',
        runsCount: est.runsCount,
        windowStart: new Date(est.firstRun),
        windowEnd: new Date(est.lastRun),
      },
    });
    return est;
  }
}
