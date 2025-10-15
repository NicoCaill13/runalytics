import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { StravaService } from '@/infra/strava/strava.service';
import { StravaTokenGuard } from '@/infra/strava/token.guard';
import { isRunSport, mapStravaToDomain } from '@/shared/types/activity';
import { HeartRateStatus } from '@/shared/types/strava';
import { computeSessionLoad } from '@/core/feature-engine/load';
import { WeeklyFeaturesService } from '@/api/analytics/weekly-features.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strava: StravaService,
    private readonly tokenGuard: StravaTokenGuard,
    private readonly weeklyFeatures: WeeklyFeaturesService,
  ) {}

  async backfillLoads(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const hrStatus = (user.heartRateStatus as 'none' | 'partial' | 'ready') ?? 'none';

    const acts = await this.prisma.activity.findMany({
      where: { userId },
      select: {
        id: true,
        distanceM: true,
        movingTimeS: true,
        avgHr: true,
        sport: true,
        providerId: true,
        dateUtc: true,
        dateLocal: true,
        elevGainM: true,
        avgCadSpm: true,
        avgPaceSpKm: true,
      },
      take: 1000, // batch si tu veux itérer
    });

    let updated = 0;
    for (const a of acts) {
      const load = computeSessionLoad(a as any, { heartRateStatus: hrStatus });
      await this.prisma.activity.update({ where: { id: a.id }, data: { load } });
      updated++;
    }
    return { updated };
  }

  async syncUserActivities(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const accessToken = await this.tokenGuard.getFreshAccessToken(userId);
    const hrStatus = (user?.heartRateStatus as 'none' | 'partial' | 'ready') ?? 'none';

    const afterEpoch = user.lastSyncedAt ? Math.floor(user.lastSyncedAt.getTime() / 1000) : undefined;

    let saved = 0;
    let newest: Date | undefined = user.lastActivityAt ?? undefined;

    for await (const page of this.strava.iterateAllActivities(accessToken, afterEpoch, 200, 200)) {
      const runPage = page.filter((a) => isRunSport(a.sport_type));
      if (!runPage.length) continue;

      for (const a of runPage) {
        const mapped = mapStravaToDomain(a);
        const load = computeSessionLoad(mapped, { heartRateStatus: hrStatus });

        await this.prisma.activity.upsert({
          where: { providerId: mapped.providerActivityId },
          update: {
            avgHr: mapped.avgHr ?? null,
            maxHr: mapped.maxHr ?? null,
            avgCadSpm: mapped.avgCadenceSpm ?? null,
            avgPaceSpKm: mapped.avgPaceSecPerKm ? Math.round(mapped.avgPaceSecPerKm) : null,
            load,
          },
          create: {
            userId,
            providerId: mapped.providerActivityId,
            dateUtc: new Date(mapped.dateUtc),
            dateLocal: new Date(mapped.dateLocal),
            distanceM: Math.round(mapped.distanceM),
            movingTimeS: mapped.movingTimeS,
            elevGainM: Math.round(mapped.elevGainM),
            sport: mapped.sport,
            avgHr: mapped.avgHr ?? null,
            maxHr: mapped.maxHr ?? null,
            avgCadSpm: mapped.avgCadenceSpm ?? null,
            avgPaceSpKm: mapped.avgPaceSecPerKm ? Math.round(mapped.avgPaceSecPerKm) : null,
            load,
          },
        });
        saved++;
        const d = new Date(mapped.dateUtc);
        if (!newest || d > newest) newest = d;
      }
    }
    const [fcSessions, totalSessions] = await Promise.all([
      this.prisma.activity.count({
        where: { userId, avgHr: { not: null } },
      }),
      this.prisma.activity.count({
        where: { userId },
      }),
    ]);

    const coverage = totalSessions > 0 ? fcSessions / totalSessions : 0;

    // Détermination du statut
    let heartRateStatus: HeartRateStatus = 'none';
    if (fcSessions === 0) {
      heartRateStatus = 'none';
    } else if (coverage < 0.7) {
      heartRateStatus = 'partial';
    } else {
      heartRateStatus = 'ready';
    }

    // Mise à jour du user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hasHeartRateData: fcSessions > 0,
        heartRateCoverage: coverage,
        heartRateStatus,
      },
    });

    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastSyncedAt: now,
        lastActivityAt: newest ?? user.lastActivityAt ?? null,
      },
    });

    await this.weeklyFeatures.computeForUser(userId, /* since= */ new Date(Date.now() - 1000 * 60 * 60 * 24 * 35));

    return {
      userId,
      saved,
      lastSyncedAt: now,
      lastActivityAt: newest ?? user.lastActivityAt ?? null,
      heartRateStatus,
      heartRateCoverage: coverage,
    };
  }
}
