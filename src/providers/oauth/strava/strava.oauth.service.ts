import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { StravaTokenResponseSchema, StravaTokenResponse } from './strava.oauth.dto';
import { StravaService } from '../../../infra/strava/strava.service';
import { ProviderAccountService } from '@/api/providerAccount/providerAccount.service';

@Injectable()
export class StravaOauthService {
  private readonly oauthUrl = 'https://www.strava.com/oauth';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly strava: StravaService,
    private readonly provider: ProviderAccountService,
  ) { }

  buildAuthorizeUrl(state: string) {
    const clientId = this.config.get<string>('strava.clientId')!;
    const redirectUri = this.config.get<string>('strava.redirectUri')!;
    const scope = 'read,activity:read_all';
    const approval_prompt = 'auto';

    const url =
      `${this.oauthUrl}/authorize?client_id=${clientId}` +
      `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}&approval_prompt=${approval_prompt}&state=${encodeURIComponent(state)}`;

    return url;
  }

  async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
    const clientId = this.config.get<string>('strava.clientId')!;
    const clientSecret = this.config.get<string>('strava.clientSecret')!;

    const { data } = await firstValueFrom(
      this.http.post(`${this.oauthUrl}/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    );

    const parsed = StravaTokenResponseSchema.parse(data);
    return parsed;
  }

  async getFreshAccessToken(userId: string) {
    const providerAccount = await this.provider.getProvider(userId, 'STRAVA');

    if (!providerAccount?.refreshToken) throw new Error('Strava non lié');

    const now = Date.now();
    if (providerAccount.expiresAt && providerAccount.expiresAt.getTime() - now > 60_000 && providerAccount.accessToken) {
      return providerAccount.accessToken; // encore valide
    }

    const refreshed = await this.refreshToken(providerAccount.refreshToken);

    const updated = await this.provider.refreshTokens('STRAVA', refreshed);

    return updated.accessToken!;
  }

  async refreshToken(refreshToken: string): Promise<StravaTokenResponse> {
    const clientId = this.config.get<string>('strava.clientId')!;
    const clientSecret = this.config.get<string>('strava.clientSecret')!;

    const { data } = await firstValueFrom(
      this.http.post(`${this.oauthUrl}/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    );

    return StravaTokenResponseSchema.parse(data);
  }

  async upsertProviderAccount(parsed: StravaTokenResponse, payload) {
    const athlete = await this.strava.getLoggedInAthlete(parsed.access_token);
    const provider = 'STRAVA' as const;

    return this.provider.upsertProviderAccount(parsed, provider, athlete, payload);
  }

  deactivate(providerName, userId) {
    return this.provider.toggle(providerName, userId, false);
  }

  reactivate(providerName, userId) {
    return this.provider.toggle(providerName, userId, true);
  }
}
