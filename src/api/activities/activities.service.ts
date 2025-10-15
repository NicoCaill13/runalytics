import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { StravaService } from '@/infra/strava/strava.service';
import { StravaTokenGuard } from '@/infra/strava/token.guard';
import { isRunSport, mapStravaToDomain } from '@/shared/types/activity';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strava: StravaService,
    private readonly tokenGuard: StravaTokenGuard,
  ) {}

  async syncUserActivities(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const accessToken = await this.tokenGuard.getFreshAccessToken(userId);

    const afterEpoch = user.lastSyncedAt ? Math.floor(user.lastSyncedAt.getTime() / 1000) : undefined;

    let saved = 0;
    let newest: Date | undefined = user.lastActivityAt ?? undefined;

    for await (const page of this.strava.iterateAllActivities(accessToken, afterEpoch, 200, 200)) {
      const runPage = page.filter((a) => isRunSport(a.sport_type));
      if (!runPage.length) continue;

      for (const a of runPage) {
        const mapped = mapStravaToDomain(a);
        await this.prisma.activity.upsert({
          where: { providerId: mapped.providerActivityId },
          update: {},
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
          },
        });
        saved++;
        const d = new Date(mapped.dateUtc);
        if (!newest || d > newest) newest = d;
      }
    }
    return { userId, saved };
  }
}
