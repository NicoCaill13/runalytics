import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { StravaActivity } from '@/types/strava';
import { PrismaService } from '@/infra/db/prisma.service';
import { ActivityType, Prisma, Provider, ProviderAccount } from '@prisma/client';
import { SyncStravaActivitiesDto } from './sync-strava-activities.dto';
import { RollingBestService } from '@/api/rollingBest/rollingBest.service';

@Injectable()
export class StravaService {
  private readonly logger = new Logger(StravaService.name);
  private readonly baseUrl = 'https://www.strava.com/api/v3';

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly rollingBestService: RollingBestService,
  ) { }

  private async fetchActivitiesPage(
    accessToken: string,
    page: number,
    perPage: number,
    afterEpochSeconds?: number,
  ): Promise<StravaActivity[]> {
    try {
      const url = `${this.baseUrl}/athlete/activities`;
      const params: Record<string, any> = {
        page,
        per_page: perPage,
      };
      if (afterEpochSeconds) {
        params.after = afterEpochSeconds;
      }

      const obs = this.http.get<StravaActivity[]>(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });

      const { data } = await firstValueFrom(obs);
      return data;
    } catch (error: any) {
      this.logger.error(`Erreur fetchActivitiesPage (page=${page}): ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  private async upsertStravaActivity(userId: string, account: ProviderAccount, sa: StravaActivity) {
    const provider = Provider.STRAVA;
    const raw = sa as any;

    const providerActivityId = String(sa.id);
    const externalId = sa.external_id || providerActivityId;

    const where: Prisma.ActivityWhereUniqueInput = {
      userId_provider_externalId: {
        userId,
        provider,
        externalId,
      },
    };

    // start/end lat/lng
    const startLat = sa.start_latlng?.[0] ?? null;
    const startLng = sa.start_latlng?.[1] ?? null;
    const endLat = sa.end_latlng?.[0] ?? null;
    const endLng = sa.end_latlng?.[1] ?? null;

    const timezone: string | null = raw.timezone ?? null;
    const utcOffset: number | null = raw.utc_offset ?? null;

    const avgPaceSecPerKm = sa.average_speed && sa.average_speed > 0 ? 1000 / sa.average_speed : null;

    const sufferScore: number | null = raw.suffer_score ?? null;

    // 🔥 ici on sécurise : si raw.map est un objet, on prend summary_polyline, sinon null
    const summaryPolyline: string | null = raw.map && typeof raw.map === 'object' ? (raw.map.summary_polyline ?? null) : null;

    const data: Prisma.ActivityUncheckedCreateInput = {
      userId,
      provider,
      providerActivityId,
      externalId,
      accountId: account.id,

      name: sa.name || '',
      startDate: new Date(sa.start_date),
      startDateLocal: new Date(sa.start_date_local),
      timezone,
      utcOffset,

      distanceM: sa.distance ?? 0,
      movingTimeSec: sa.moving_time ?? sa.elapsed_time ?? 0,
      elapsedTimeSec: sa.elapsed_time ?? sa.moving_time ?? 0,
      totalElevGainM: sa.total_elevation_gain ?? null,

      avgSpeedMps: sa.average_speed ?? null,
      maxSpeedMps: sa.max_speed ?? null,
      avgPaceSecPerKm: avgPaceSecPerKm ?? null,

      hasHeartrate: !!sa.has_heartrate,
      avgHr: sa.average_heartrate ? Math.round(sa.average_heartrate) : null,
      maxHr: sa.max_heartrate ?? null,
      avgCadence: sa.average_cadence ?? null,

      sufferScore,
      load: sufferScore,

      startLat,
      startLng,
      endLat,
      endLng,
      polyline: summaryPolyline,

      type: null as any, // à classifier plus tard
    };

    // Dans un upsert, on sépare create/update (tu peux être plus fin sur update si tu veux)
    const activity = await this.prisma.activity.upsert({
      where,
      create: data,
      update: {
        name: data.name,
        distanceM: data.distanceM,
        movingTimeSec: data.movingTimeSec,
        elapsedTimeSec: data.elapsedTimeSec,
        totalElevGainM: data.totalElevGainM,
        avgSpeedMps: data.avgSpeedMps,
        maxSpeedMps: data.maxSpeedMps,
        avgPaceSecPerKm: data.avgPaceSecPerKm,
        hasHeartrate: data.hasHeartrate,
        avgHr: data.avgHr,
        maxHr: data.maxHr,
        avgCadence: data.avgCadence,
        sufferScore: data.sufferScore,
        startLat: data.startLat,
        startLng: data.startLng,
        endLat: data.endLat,
        endLng: data.endLng,
        polyline: data.polyline,
        load: data.load,
      },
    });

    return activity;
  }

  /**
   * Upsert du stream brut dans ActivityStream.
   * `rawStream` est ce que retourne Strava pour /streams?key_by_type=true
   */
  private async upsertActivityStream(activityId: string, rawStream: any) {
    const time = rawStream.time?.data ?? [];
    const distance = rawStream.distance?.data ?? [];
    const altitude = rawStream.altitude?.data ?? null;
    const hr = rawStream.heartrate?.data ?? null;

    await this.prisma.activityStream.upsert({
      where: { activityId },
      create: {
        activityId,
        source: Provider.STRAVA,
        timeSec: time,
        distanceM: distance,
        altitudeM: altitude,
        heartRate: hr,
        // simplified: Prisma.JsonNull, // possible, mais pas nécessaire
      },
      update: {
        timeSec: time,
        distanceM: distance,
        altitudeM: altitude,
        heartRate: hr,
      },
    });
  }

  async syncAccountActivities(accountId: string, dto: SyncStravaActivitiesDto) {
    const account = await this.prisma.providerAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('ProviderAccount introuvable');
    }
    if (account.provider !== Provider.STRAVA) {
      throw new BadRequestException('ProviderAccount ne correspond pas à STRAVA');
    }
    if (!account.accessToken) {
      throw new BadRequestException('Pas de accessToken pour ce ProviderAccount');
    }

    const accessToken = account.accessToken;
    const userId = account.userId;

    // Déterminer "after" pour Strava
    let afterEpochSeconds: number | undefined;

    if (dto.from) {
      afterEpochSeconds = Math.floor(new Date(dto.from).getTime() / 1000);
    } else {
      // On part de la dernière activité Strava en DB (par startDate UTC)
      const last = await this.prisma.activity.findFirst({
        where: {
          userId,
          provider: Provider.STRAVA,
        },
        orderBy: { startDate: 'desc' },
        select: { startDate: true },
      });

      if (last) {
        // 👉 on part juste APRÈS la dernière startDate, pas avant
        afterEpochSeconds = Math.floor(last.startDate.getTime() / 1000) + 1;
      }
    }

    this.logger.log(`Sync Strava account=${accountId} user=${userId} after=${afterEpochSeconds}`);

    const importedActivities: string[] = [];
    let page = 1;

    while (page <= dto.maxPages) {
      const stravaActivities = await this.fetchActivitiesPage(accessToken, page, dto.perPage, afterEpochSeconds);

      if (!stravaActivities.length) {
        break;
      }

      // 👉 on ne garde QUE les runs
      const runActivities = stravaActivities.filter((sa) => {
        const raw = sa as any;
        const sportType = raw.sport_type ?? sa['sportType'] ?? raw.type;
        return sportType === 'Run';
      });

      this.logger.log(`Page ${page}: ${stravaActivities.length} activités, ${runActivities.length} runs conservés`);

      for (const sa of runActivities) {
        const activity = await this.upsertStravaActivity(userId, account, sa);
        importedActivities.push(activity.id);

        if (dto.includeStreams) {
          try {
            const stream = await this.getStreamsActivity(accessToken, sa.id);
            await this.upsertActivityStream(activity.id, stream);
            await this.rollingBestService.updateForActivity(activity.id);
          } catch (err) {
            this.logger.warn(`Impossible de récupérer le stream pour activity=${activity.id}: ${err}`);
          }
        }
      }

      if (stravaActivities.length < dto.perPage) {
        // Fin de liste côté Strava
        break;
      }
      page++;
    }

    return {
      importedCount: importedActivities.length,
      activityIds: importedActivities,
    };
  }

  // src/infra/strava/strava.service.ts
  async getLoggedInAthlete(accessToken: string) {
    const url = `${this.baseUrl}/athlete`;
    const res = await lastValueFrom(
      this.http.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return res.data as {
      id: number;
      username: string | null;
      firstname: string | null;
      lastname: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      sex?: 'M' | 'F' | null;
      premium?: boolean;
      profile?: string | null;
      profile_medium?: string | null;
      measurement_preference?: 'feet' | 'meters';
    };
  }

  async getStreamsActivity(accessToken: string, activityId: number | string) {
    try {
      const url = `${this.baseUrl}/activities/${activityId}/streams`;
      const params = {
        keys: 'time,distance,altitude,heartrate',
        series_type: 'distance',
        resolution: 'high',
        key_by_type: true,
      };

      const obs = this.http.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });

      const { data } = await firstValueFrom(obs);
      return data;
    } catch (error: any) {
      this.logger.error(`Erreur getStreamsActivity (id=${activityId}): ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
