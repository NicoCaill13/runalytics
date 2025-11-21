import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { CardioService } from '../cardio/cardio.service';
import { round2 } from '../cardio/cardio.dto';

@Injectable()
export class VmaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cardio: CardioService,
  ) { }
  private async estimateVmaFromRollingBests(userId: string): Promise<number | null> {
    const [best, runsCount] = await this.prisma.$transaction([
      this.prisma.activityRollingBest.findFirst({
        where: {
          userId,
          speedMps360: { not: null },
        },
        orderBy: {
          speedMps360: 'desc',
        },
        select: {
          speedMps360: true,
        },
      }),
      this.prisma.activityRollingBest.count({
        where: {
          userId,
          speedMps360: { not: null },
        },
      }),
    ]);

    if (!best || best.speedMps360 == null || runsCount === 0) {
      throw new BadRequestException("Impossible d'estimer la VMA : pas assez de runs avec une fenêtre 6'.");
    }

    const speedMps = Number(best.speedMps360);
    if (!speedMps || speedMps <= 0) {
      throw new BadRequestException("Impossible d'estimer la VMA : valeur de speedMps360 invalide.");
    }

    const vmaKph = round2(speedMps * 3.6);
    return vmaKph;
  }

  async getOrEstimateVmaKph(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`user ${userId} not found`);
    }
    const existing = await this.cardio.getPhysioValue(userId, 'VMA');
    if (existing && existing > 0) {
      return existing;
    }

    // 2) Sinon on tente une estimation via les rolling best 6'
    const estimated = await this.estimateVmaFromRollingBests(userId);
    if (!estimated) {
      throw new BadRequestException("Impossible d'estimer la VMA : pas assez de données de course (rolling best 6').");
    }

    // 3) On enregistre la VMA estimée dans PhysioHistory
    await this.cardio.createPhysioValue(userId, {
      metric: 'VMA',
      source: 'ESTIMATED',
      value: estimated,
    });

    return estimated;
  }

  // private async getVmaCutoff(userId: string): Promise<Date | undefined> {
  //   const last = await this.prisma.physioHistory.findFirst({
  //     where: { userId, metric: 'VMA', source: 'ESTIMATED' },
  //     orderBy: { createdAt: 'desc' },
  //     select: { windowEnd: true, createdAt: true },
  //   });
  //   return last ? (last.windowEnd ?? last.createdAt) : undefined;
  // }

  // private async loadRollingBestsSince(userId: string, cutoff?: Date) {
  //   return await this.prisma.activityRollingBest.findMany({
  //     where: {
  //       userId,
  //       activity: {
  //         is: {
  //           ...(cutoff ? { dateUtc: { gt: cutoff } } : {}),
  //           OR: [{ type: { not: 'VMA' } }, { type: null }],
  //         },
  //       },
  //     },
  //     include: { activity: { select: { dateUtc: true, type: true } } },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // }

  // private pickBestCandidate(rows: ARBRow[]) {
  //   let best: {
  //     speedMs: number;
  //     windowSec: 360 | 720;
  //     startDate: Date;
  //     startOffsetS: number;
  //     endOffsetS: number;
  //   } | null = null;

  //   for (const r of rows) {
  //     const cand360 =
  //       r.speedMps360 != null
  //         ? {
  //           speedMs: Number(r.speedMps360),
  //           windowSec: 360 as const,
  //           startDate: r.activity.dateUtc,
  //           startOffsetS: r.startOffsetS360!,
  //           endOffsetS: r.endOffsetS360!,
  //         }
  //         : null;

  //     const cand720 =
  //       r.speedMps720 != null
  //         ? {
  //           speedMs: Number(r.speedMps720),
  //           windowSec: 720 as const,
  //           startDate: r.activity.dateUtc,
  //           startOffsetS: r.startOffsetS720!,
  //           endOffsetS: r.endOffsetS720!,
  //         }
  //         : null;

  //     for (const c of [cand360, cand720]) {
  //       if (!c) continue;
  //       if (!best || c.speedMs > best.speedMs) best = c;
  //     }
  //   }
  //   return best;
  // }

  // async estimateFromActivities(userId: string): Promise<VmaEstimate> {
  //   const cutoff = await this.getVmaCutoff(userId);
  //   const runs = await this.loadRollingBestsSince(userId, cutoff);
  //   if (!runs.length) throw new NotFoundException('No activities');

  //   const last = runs.pop();
  //   const first = runs.shift();

  //   const best = this.pickBestCandidate(runs);
  //   if (!best) throw new NotFoundException('No activities');

  //   const needVmaUser = !(await this.cardio.hasUserPhysio(userId, 'VMA'));
  //   const needHrMaxUser = !(await this.cardio.hasUserPhysio(userId, 'FC_MAX'));
  //   const needHrRestUser = !(await this.cardio.hasUserPhysio(userId, 'FC_REPOS'));
  //   const needsSetup = needVmaUser || needHrMaxUser || needHrRestUser;

  //   return {
  //     vmaMps: best.speedMs,
  //     vmaKph: mpsToKph(best.speedMs),
  //     pacePerKm: kphToPaceStr(mpsToKph(best.speedMs)),
  //     source: 'ESTIMATED',
  //     confidence: 0.5,
  //     firstRun: first?.activity?.dateUtc,
  //     lastRun: last?.activity?.dateUtc,
  //     runsCount: runs.length,
  //     needsSetup,
  //   };
  // }

  // async estimateAndPersist(userId: string): Promise<VmaEstimate> {
  //   const user = await this.prisma.user.findUnique({ where: { id: userId } });
  //   if (!user) {
  //     throw new NotFoundException();
  //   }

  //   const est = await this.estimateFromActivities(userId);
  //   if (!est) {
  //     throw new NotFoundException();
  //   }
  //   const estimation = await this.prisma.physioHistory.findFirst({
  //     where: {
  //       userId: userId,
  //       metric: 'VMA',
  //       windowStart: new Date(est.firstRun),
  //       windowEnd: new Date(est.lastRun),
  //     },
  //   });
  //   if (estimation) {
  //     throw new BadRequestException('This VMA already exist', {
  //       cause: new Error(),
  //       description: `Date range ${estimation.windowStart} - ${estimation.windowEnd} already exists`,
  //     });
  //   }
  //   await this.prisma.physioHistory.create({
  //     data: {
  //       userId: userId,
  //       metric: 'VMA',
  //       value: new Prisma.Decimal(mpsToKph(est.vmaMps)),
  //       source: 'ESTIMATED',
  //       runsCount: est.runsCount,
  //       windowStart: new Date(est.firstRun),
  //       windowEnd: new Date(est.lastRun),
  //     },
  //   });
  //   return est;
  // }

  // async current(userId: string) {
  //   const user = await this.prisma.user.findUnique({ where: { id: userId } });
  //   if (!user) {
  //     throw new NotFoundException();
  //   }
  //   const cardio = await this.cardio.getPhysioValue(userId, 'VMA');
  //   return {
  //     VMA: cardio,
  //   };
  // }
}
