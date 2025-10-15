import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { StravaActivity, StravaActivitiesResponse } from '@/shared/types/strava';

@Injectable()
export class StravaService {
  private readonly logger = new Logger(StravaService.name);
  private readonly baseUrl = 'https://www.strava.com/api/v3';

  constructor(private readonly http: HttpService) {}

  /**
   * Récupère une page d'activités Strava de l'athlète (typée).
   */
  async getAthleteActivities(accessToken: string, page = 1, perPage = 200, afterEpoch?: number): Promise<StravaActivity[]> {
    const url = `${this.baseUrl}/athlete/activities`;
    const params: Record<string, number> = { per_page: perPage, page };
    if (afterEpoch) params.after = afterEpoch;

    const obs = this.http.get<StravaActivitiesResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: perPage, page },
    });

    const { data }: AxiosResponse<StravaActivitiesResponse> = await firstValueFrom(obs);
    return data;
  }

  /**
   * Itérateur pratique pour paginer proprement jusqu'à épuisement des résultats.
   */
  async *iterateAllActivities(accessToken: string, afterEpoch?: number, perPage = 200, maxPages = 100): AsyncGenerator<StravaActivity[]> {
    for (let page = 1; page <= maxPages; page++) {
      const chunk = await this.getAthleteActivities(accessToken, page, perPage, afterEpoch);
      if (!chunk.length) break;
      yield chunk;
    }
  }
}
