import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { ThresholdsService } from '@/api/analytics/thresholds.service';
import { UserResponseDto } from './dto/user.dto';
import { kphToMps, mpsToKph } from '@/types/strava';

function kphFromMps(mps?: number | null) {
  return mps ? +(mps * 3.6).toFixed(2) : null;
}
function paceStrFromKph(kph?: number | null) {
  if (!kph) return null;
  const s = Math.round(3600 / kph);
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}/km`;
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const normMid = (x: number, min: number, max: number) => clamp01(1 - Math.abs(x - (min + max) / 2) / ((max - min) / 2));

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly thresholds: ThresholdsService,
  ) {}

  private buildInsights(avg: { acwr?: number | null; monotony?: number | null }, t?: UserResponseDto['thresholds']): string[] {
    const out: string[] = [];
    if ((avg.monotony ?? 0) > 2.5) out.push('Monotonie élevée récemment : varie davantage (EF/Tempo/SL).');
    if ((avg.acwr ?? 0) > 1.3) out.push('Charge en hausse rapide (ACWR) : prévois une semaine plus légère.');
    if (t) out.push(`Référence perso: p50 charge = ${t.loadWeek.p50.toFixed(0)} AU, p75 = ${t.loadWeek.p75.toFixed(0)} AU.`);
    return out.slice(0, 3);
  }

  async getByUserId(userId: string) {
    // const [user, lastWeek, th] = await Promise.all([
    //   this.prisma.user.findUnique({
    //     where: { id: userId },
    //     select: {
    //       id: true,
    //       userName: true,
    //       sex: true,
    //       profile: true,
    //       profileMedium: true,
    //       city: true,
    //       country: true,
    //       measurementPref: true,
    //       coachPersonality: true,
    //       runnerType: true,
    //       heartRateStatus: true,
    //     },
    //   }),
    //   this.prisma.weeklyFeatures.findFirst({
    //     where: { userId },
    //     orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    //   }),
    //   this.thresholds.forUser(userId).catch(() => null),
    // ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userName: true,
        sex: true,
        profile: true,
        profileMedium: true,
        city: true,
        country: true,
        measurementPref: true,
        coachPersonality: true,
        runnerType: true,
        heartRateStatus: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // const thresholdsDto: UserResponseDto['thresholds'] = th
    //   ? {
    //       loadWeek: { p50: th.loadWeek.p50, p75: th.loadWeek.p75 },
    //       acwr: { p50: th.acwr.p50, p75: th.acwr.p75 },
    //       day: {
    //         p50: th.day.p50,
    //         p75: th.day.p75,
    //         p90: th.day.p90 ?? th.day.p75, // fallback si p90 manquant
    //       },
    //     }
    //   : null;

    // // Score global (même logique que summary)
    // let scoreGlobal: number | null = null;
    // if (lastWeek && th) {
    //   const loadScore = normMid(lastWeek.loadWeek ?? 0, th.loadWeek.p50, th.loadWeek.p75);
    //   const acwrScore = normMid(lastWeek.acwr ?? 1.0, 0.8, 1.3);
    //   const monoScore = normMid(lastWeek.monotony ?? 2.0, 1.3, 2.0);
    //   scoreGlobal = Math.round((loadScore * 0.4 + acwrScore * 0.4 + monoScore * 0.2) * 100);
    // }

    return user;
  }

  async updateUserMetrics(
    userId: string,
    data: {
      age?: number;
      fcm?: number;
      fcrepos?: number;
      vmaMps?: number;
      vmaKph?: number;
    },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.age !== undefined && { age: data.age }),
        ...(data.fcm !== undefined && { fcm: data.fcm }),
        ...(data.fcrepos !== undefined && { fcrepos: data.fcrepos }),
        ...(data.vmaMps !== undefined && {
          vmaMps: data.vmaMps,
          vmaKph: mpsToKph(data.vmaMps),
          vmaUpdatedAt: new Date(),
        }),
        ...(data.vmaKph !== undefined && {
          vmaKph: data.vmaKph,
          vmaMps: kphToMps(data.vmaKph),
          vmaUpdatedAt: new Date(),
        }),
      },
    });
    return {
      message: 'Profil mis à jour avec succès',
      updatedFields: Object.keys(data),
      user: {
        id: updated.id,
        age: updated.age,
      },
    };
  }
}
