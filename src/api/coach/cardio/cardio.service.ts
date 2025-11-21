import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { MetricSourceType as MetricSource, PhysioDto, round2, paceFromKph } from './cardio.dto';
import type { ZonesResponse, HrrZone, VmaZone, VmaBand } from './cardio.dto';

const HRR_BANDS = [
  { id: 'Z1' as const, from: 0.5, to: 0.6 },
  { id: 'Z2' as const, from: 0.6, to: 0.7 },
  { id: 'Z3' as const, from: 0.7, to: 0.8 },
];
const VMA_BANDS = [
  { name: 'Endurance' as const, from: 0.6, to: 0.7 },
  { name: 'Marathon' as const, from: 0.7, to: 0.8 },
  { name: 'Seuil' as const, from: 0.8, to: 0.88 },
  { name: 'VO2' as const, from: 0.95, to: 1.0 },
  { name: 'Sprint' as const, from: 1.05, to: 1.15 },
];

@Injectable()
export class CardioService {
  constructor(private readonly prisma: PrismaService) { }

  private estimateHrMax(age: number): number {
    return Math.round(208 - 0.7 * age);
  }

  private estimateHrMin(): number {
    return 60;
  }

  private estimateHrReserve(age): number {
    return this.estimateHrMax(age) - this.estimateHrMin();
  }

  async hasUserPhysio(userId: string, metric: MetricSource) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const row = await this.prisma.physioHistory.findFirst({
      where: { userId, metric, source: 'USER' },
      select: { id: true },
    });
    return !!row;
  }

  async getPhysioValue(userId: string, metric: MetricSource) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rowUser = await this.prisma.physioHistory.findFirst({
      where: { userId, metric, source: 'USER' },
      orderBy: { createdAt: 'desc' },
      select: { value: true },
    });
    if (rowUser) return Number(rowUser.value);

    const rowEst = await this.prisma.physioHistory.findFirst({
      where: { userId, metric, source: 'ESTIMATED' },
      orderBy: { createdAt: 'desc' },
      select: { value: true },
    });
    return rowEst ? Number(rowEst.value) : null;
  }

  async createPhysioValue(userId: string, dto: PhysioDto) {
    const trackedMetrics: MetricSource[] = ['FC_REPOS', 'FC_MAX', 'FC_RESERVE', 'VMA'];

    const now = new Date();
    if (!trackedMetrics.includes(dto.metric)) {
      return this.prisma.physioHistory.create({
        data: {
          userId,
          metric: dto.metric,
          source: dto.source,
          value: dto.value,
          runsCount: dto.runsCount ?? null,
          windowStart: now ?? null,
          windowEnd: now ?? null,
        },
      });
    }
    const active = await this.prisma.physioHistory.findFirst({
      where: {
        userId,
        metric: dto.metric,
        source: dto.source,
        windowEnd: null,
      },
      orderBy: { windowStart: 'desc' },
    });
    // On ne fait rien, on renvoie juste la ligne actuelle
    if (active && Number(active.value) === Number(dto.value)) {
      return active;
    }
    if (active) {
      await this.prisma.physioHistory.update({
        where: { id: active.id },
        data: { windowEnd: now },
      });
    }
    return this.prisma.physioHistory.create({
      data: {
        userId,
        metric: dto.metric,
        source: dto.source,
        value: dto.value,
        runsCount: dto.runsCount ?? null,
        windowStart: now,
        windowEnd: null,
      },
    });
  }

  async computeZones(userId: string): Promise<ZonesResponse> {
    const vmaKph = await this.getPhysioValue(userId, 'VMA');
    const hrMax = await this.getPhysioValue(userId, 'FC_MAX');
    const hrRest = await this.getPhysioValue(userId, 'FC_REPOS');

    if (!vmaKph || !hrMax || !hrRest) {
      throw new BadRequestException('Missing VMA or HR values');
    }
    const hrr = hrMax - hrRest;

    const enduranceZones: HrrZone[] = HRR_BANDS.map((b) => {
      const fromKph = round2(vmaKph * b.from);
      const toKph = round2(vmaKph * b.to);
      return {
        id: b.id,
        metric: 'HRR',
        percHRR: { from: b.from, to: b.to },
        bpm: {
          from: Math.round(hrRest + b.from * hrr),
          to: Math.round(hrRest + b.to * hrr),
        },
        pace: { from: paceFromKph(toKph), to: paceFromKph(fromKph) },
        kph: { from: fromKph, to: toKph },
      };
    });

    const vmaBands: VmaBand[] = VMA_BANDS.map((b) => {
      const fromKph = round2(vmaKph * b.from);
      const toKph = round2(vmaKph * b.to);
      return {
        name: b.name,
        percVMA: { from: b.from, to: b.to },
        kph: { from: fromKph, to: toKph },
        pace: { from: paceFromKph(toKph), to: paceFromKph(fromKph) }, // nb: plus vite = pace plus petit
      };
    });

    const seuil = vmaBands.find((b) => b.name === 'Seuil')!;
    const vo2 = vmaBands.find((b) => b.name === 'VO2')!;

    const qualityZones: VmaZone[] = [
      {
        id: 'Z4',
        metric: 'VMA',
        label: 'Seuil',
        percVMA: seuil.percVMA,
        kph: seuil.kph,
        pace: seuil.pace,
      },
      {
        id: 'Z5',
        metric: 'VMA',
        label: 'VO2',
        percVMA: vo2.percVMA,
        kph: vo2.kph,
        pace: vo2.pace,
      },
    ];

    return {
      vmaKph,
      hr: { rest: hrRest, max: hrMax, hrr },
      enduranceZones,
      qualityZones,
      vmaBands,
    };
  }
}
