import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { StravaService } from '@/infra/strava/strava.service';
//import { StravaTokenGuard } from '@/infra/strava/token.guard';
import { bestWindow, computeVmaMs, isIntervalWorkout, isRunSport, mapStravaToDomain, mapStreamsToPoints, Point } from '@/types/activity';
import { HeartRateStatus, mpsToKph } from '@/types/strava';
import { computeSessionLoad } from '@/core/feature-engine/load';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strava: StravaService,
    //private readonly tokenGuard: StravaTokenGuard,
  ) { }

  /* private async getActivitiesStreams(accessToken, activityID, userId) {
    try {
      const stream = await this.strava.getStreamsActivities(accessToken, activityID);
      const isHiit = isIntervalWorkout(stream);
      if (isHiit) {
        await this.prisma.activity.update({
          where: { providerId: activityID },
          data: { type: 'VMA' },
        });
        return;
      }

      const pts = mapStreamsToPoints(stream);
      if (pts[0].t === 0 && pts[0].dist === 0 && pts[0].elev === 0 && pts[0].hr === 0) {
        await this.prisma.activity.update({
          where: { providerId: activityID },
          data: { type: 'INDOOR' },
        });
        return;
      }

      await this.saveRollingBestsForActivity(userId, activityID, pts);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async saveRollingBestsForActivity(userId: string, activityId: string, pts: Point[]) {
    try {
      const b360 = bestWindow(pts, 360);
      const b720 = bestWindow(pts, 720);

      const avg = computeVmaMs(b360, b720);
      await this.prisma.activityRollingBest.create({
        data: {
          userId,
          activityId,
          averageSpeedMps: avg,
          averageSpeedKmh: avg ? mpsToKph(avg) : null,
          ...(b360
            ? {
                startOffsetS360: pts[b360.i0].t,
                endOffsetS360: pts[b360.i1].t,
                distanceM360: Math.round(pts[b360.i1].dist - pts[b360.i0].dist),
                speedMps360: b360.v,
                avgHr360: b360.avgHr ?? null,
                dPlusM360: b360.dplus ?? null,
              }
            : {}),
          ...(b720
            ? {
                startOffsetS720: pts[b720.i0].t,
                endOffsetS720: pts[b720.i1].t,
                distanceM720: Math.round(pts[b720.i1].dist - pts[b720.i0].dist),
                speedMps720: b720.v,
                avgHr720: b720.avgHr ?? null,
                dPlusM720: b720.dplus ?? null,
              }
            : {}),
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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

        const activity = await this.prisma.activity.upsert({
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

        await this.getActivitiesStreams(accessToken, activity.providerId, userId);

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

    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastSyncedAt: now,
        lastActivityAt: newest ?? user.lastActivityAt ?? null,
        hasHeartRateData: fcSessions > 0,
        heartRateCoverage: coverage,
        heartRateStatus,
      },
    });

    return {
      userId,
      saved,
      lastSyncedAt: now,
      lastActivityAt: newest ?? user.lastActivityAt ?? null,
      heartRateStatus,
      heartRateCoverage: coverage,
    };
  }

  async getStreams(userId, activityId) {
    const accessToken = await this.tokenGuard.getFreshAccessToken(userId);
    const stream = await this.strava.getStreamsActivities(accessToken, activityId);
    console.log(stream);

    const pts = mapStreamsToPoints(stream);
    return { pts };
  }
    */
}
