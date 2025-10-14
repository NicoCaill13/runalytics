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
  async getAthleteActivities(accessToken: string, page = 1, perPage = 100): Promise<StravaActivity[]> {
    const url = `${this.baseUrl}/athlete/activities`;

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
  async *iterateAllActivities(accessToken: string, perPage = 100, maxPages = 50): AsyncGenerator<StravaActivity[]> {
    for (let page = 1; page <= maxPages; page++) {
      const chunk = await this.getAthleteActivities(accessToken, page, perPage);
      if (!chunk.length) break;
      yield chunk;
    }
  }
}
