import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { StravaService } from '@/infra/strava/strava.service';
import { mapStravaToDomain } from '@/shared/types/activity';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strava: StravaService,
  ) {}

  async syncUserActivities(userId: string) {
    const account = await this.prisma.stravaAccount.findUnique({ where: { userId } });
    if (!account) throw new NotFoundException('Strava account not linked');

    // TODO: refresh token si expiré (via StravaOauthService)

    let saved = 0;
    for await (const page of this.strava.iterateAllActivities(account.accessToken, 100, 10)) {
      for (const a of page) {
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
      }
    }
    return { userId, saved };
  }
}
