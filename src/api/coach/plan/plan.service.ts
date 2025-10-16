import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { percentVmaToKph, kphToPaceStr } from '@/core/pace/pace-utils';

type Session = { type: 'EF' | 'Tempo' | 'SL' | 'VO2'; title: string; pace: string };

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  buildSessions(runnerType: string, vmaMps: number): Session[] {
    const efLow = percentVmaToKph(0.6, vmaMps);
    const efHigh = percentVmaToKph(0.7, vmaMps);
    const tempoLow = percentVmaToKph(0.8, vmaMps);
    const tempoHigh = percentVmaToKph(0.85, vmaMps);
    const vo2Low = percentVmaToKph(1.0, vmaMps);
    const vo2High = percentVmaToKph(1.05, vmaMps);

    const p = (kphLow: number, kphHigh: number) => `${kphToPaceStr(kphHigh)} – ${kphToPaceStr(kphLow)}`;

    if (runnerType === 'COMPETITOR') {
      return [
        { type: 'EF', title: 'EF 50–60’', pace: p(efLow, efHigh) },
        { type: 'Tempo', title: '4x10’ r2’', pace: p(tempoLow, tempoHigh) },
        { type: 'VO2', title: '10x400m r200m', pace: p(vo2Low, vo2High) },
        { type: 'SL', title: 'SL 1h45 EF bas', pace: p(efLow, efLow * 0.98) },
      ];
    }
    if (runnerType === 'PROGRESS') {
      return [
        { type: 'EF', title: 'EF 45–55’', pace: p(efLow, efHigh) },
        { type: 'Tempo', title: '4x8’ r2’', pace: p(tempoLow, tempoHigh) },
        { type: 'SL', title: 'SL 90’ EF bas', pace: p(efLow, efLow * 0.98) },
      ];
    }
    // PLEASURE or default
    return [
      { type: 'EF', title: 'EF 40–50’', pace: p(efLow, efHigh) },
      { type: 'SL', title: 'SL 60–75’ EF bas', pace: p(efLow, efLow * 0.98) },
      { type: 'EF', title: 'EF 30–40’', pace: p(efLow, efHigh) },
    ];
  }

  async planForUser(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u?.vmaMps) throw new Error('VMA not set. Run /coach/vma/estimate/:userId first.');
    const type = u.runnerType ?? 'PROGRESS';
    const sessions = this.buildSessions(type, u.vmaMps);
    return { week: new Date().toISOString().slice(0, 10), runnerType: type, vmaMps: u.vmaMps, sessions };
  }
}
