import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';

@Injectable()
export class HrZoneAnnotatorService {
  constructor(private readonly prisma: PrismaService) {}

  private zoneFromHr(avgHr: number, zones: any): string {
    for (const [z, r] of Object.entries(zones ?? {})) {
      const rr = r as { min: number; max: number };
      if (avgHr >= rr.min && avgHr < rr.max) return z;
    }
    if (zones?.z5?.max && avgHr >= zones.z5.max) return 'z5';
    return 'z1';
  }

  private zoneFromPace(paceSpKm: number, vmaMps: number): string {
    if (!paceSpKm || !vmaMps) return 'z2';
    const v = 1000 / paceSpKm;
    const q = v / vmaMps;
    if (q < 0.6) return 'z1';
    if (q < 0.7) return 'z2';
    if (q < 0.8) return 'z3';
    if (q < 0.9) return 'z4';
    return 'z5';
  }

  async annotate(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const acts = await this.prisma.activity.findMany({
      where: { userId, hrZone: null },
      select: { id: true, avgHr: true, avgPaceSpKm: true },
      take: 1000,
    });

    let count = 0;
    for (const a of acts) {
      const zone =
        a.avgHr && user.zones ? this.zoneFromHr(a.avgHr, user.zones as any) : this.zoneFromPace(a.avgPaceSpKm ?? 0, user.vmaMps ?? 0);
      await this.prisma.activity.update({ where: { id: a.id }, data: { hrZone: zone } });
      count++;
    }
    return { annotated: count };
  }
}
