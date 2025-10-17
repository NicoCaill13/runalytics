import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { VmaEstimateDto, mpsToKph, kphToPaceStr } from '@/shared/types/strava';

function paceStrFromMps(mps: number) {
  const kph = mpsToKph(mps);
  return kphToPaceStr(kph);
}

@Injectable()
export class VmaService {
  constructor(private readonly prisma: PrismaService) {}

  private from10k(distM: number, timeS: number): VmaEstimateDto {
    const v10k = distM / timeS; // m/s
    const vma = v10k * 1.12;
    return { vmaMps: vma, vmaKph: mpsToKph(vma), pacePerKm: kphToPaceStr(mpsToKph(vma)), source: '10k_race', confidence: 0.8 };
  }
  private from5k(distM: number, timeS: number): VmaEstimateDto {
    const v5k = distM / timeS;
    const vma = v5k * 1.07;
    return { vmaMps: vma, vmaKph: mpsToKph(vma), pacePerKm: kphToPaceStr(mpsToKph(vma)), source: '5k_race', confidence: 0.7 };
  }
  private fromTempo(distM: number, timeS: number): VmaEstimateDto {
    const v = distM / timeS;
    const vma = v * 1.15;
    return { vmaMps: vma, vmaKph: mpsToKph(vma), pacePerKm: kphToPaceStr(mpsToKph(vma)), source: 'tempo', confidence: 0.5 };
  }

  private async fromStored(userId: string): Promise<VmaEstimateDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { vmaMps: true },
    });
    if (!user?.vmaMps) return null;
    const v = user.vmaMps;
    return { vmaMps: v, vmaKph: mpsToKph(v), pacePerKm: paceStrFromMps(v), source: 'stored', confidence: 1.0 };
  }

  async estimateFromActivities(userId: string): Promise<VmaEstimateDto> {
    const acts = await this.prisma.activity.findMany({
      where: { userId, sport: 'run' },
      select: { id: true, distanceM: true, movingTimeS: true, avgPaceSpKm: true, dateUtc: true },
      orderBy: { dateUtc: 'desc' },
      take: 400,
    });
    if (!acts.length) throw new Error('No activities');

    // candidats 10K (8.5..12.5 km, pauses faibles implicites dans movingTimeS)
    const c10 = acts
      .filter((a) => a.distanceM && a.movingTimeS && a.distanceM >= 8500 && a.distanceM <= 12500)
      .sort((a, b) => a.movingTimeS / a.distanceM - b.movingTimeS / b.distanceM)[0];

    if (c10) return this.from10k(c10.distanceM, c10.movingTimeS);

    // candidats 5K (4..6.5 km)
    const c5 = acts
      .filter((a) => a.distanceM && a.movingTimeS && a.distanceM >= 4000 && a.distanceM <= 6500)
      .sort((a, b) => a.movingTimeS / a.distanceM - b.movingTimeS / b.distanceM)[0];
    if (c5) return this.from5k(c5.distanceM, c5.movingTimeS);

    // tempo (20..50 min, meilleure vitesse moyenne)
    const tempo = acts
      .filter((a) => a.movingTimeS && a.movingTimeS >= 1200 && a.movingTimeS <= 3000 && a.distanceM)
      .sort((a, b) => b.distanceM / b.movingTimeS - a.distanceM / a.movingTimeS)[0];
    if (tempo) return this.fromTempo(tempo.distanceM, tempo.movingTimeS);

    // dernier recours : meilleure séance 20..30 min
    const best = acts
      .filter((a) => a.movingTimeS && a.movingTimeS >= 1200 && a.movingTimeS <= 1800 && a.distanceM)
      .sort((a, b) => b.distanceM / b.movingTimeS - a.distanceM / a.movingTimeS)[0];
    if (best) return this.fromTempo(best.distanceM, best.movingTimeS);

    throw new Error('Not enough data for VMA estimate');
  }

  async currentOrEstimate(userId: string): Promise<VmaEstimateDto> {
    const stored = await this.fromStored(userId);
    if (stored) return stored;
    return this.estimateFromActivities(userId);
  }

  async estimateAndPersist(userId: string, force = false): Promise<VmaEstimateDto> {
    if (!force) {
      const stored = await this.fromStored(userId);
      if (stored) return stored;
    }
    const est = await this.estimateFromActivities(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { vmaMps: est.vmaMps, vmaUpdatedAt: new Date(), vmaKph: mpsToKph(est.vmaMps) },
    });
    return est;
  }
}
