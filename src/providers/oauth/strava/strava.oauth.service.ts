import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { StravaTokenResponseSchema, StravaTokenResponse } from './strava.oauth.dto';
import { StravaService } from '@/providers/data/strava/strava.service';
import { ProviderAccountService } from '@/api/providerAccount/providerAccount.service';
import { AuthService } from '@/infra/auth/auth.service';

@Injectable()
export class StravaOauthService {
  private readonly oauthUrl = 'https://www.strava.com/oauth';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly strava: StravaService,
    private readonly provider: ProviderAccountService,
    private readonly auth: AuthService,
  ) { }

  private buildAuthorizeUrl(state: string) {
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

  private async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
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

  private async refreshToken(refreshToken: string): Promise<any> {
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
    return data;
  }

  private async upsertProviderAccount(parsed: StravaTokenResponse, payload) {
    const athlete = await this.strava.getLoggedInAthlete(parsed.access_token);
    const provider = 'STRAVA' as const;

    return this.provider.upsertProviderAccount(parsed, provider, athlete, payload);
  }

  async getFreshAccessToken(userId: string) {
    const providerAccount = await this.provider.getProvider(userId, 'STRAVA');
    if (!providerAccount?.refreshToken) throw new BadRequestException('Strava non lié');

    const now = Date.now();
    if (providerAccount.expiresAt && providerAccount.expiresAt.getTime() - now > 60_000 && providerAccount.accessToken) {
      return providerAccount.accessToken;
    }

    const refreshed = await this.refreshToken(providerAccount.refreshToken);
    const user = { ...refreshed, providerUserId: providerAccount.providerUserId };

    const updated = await this.provider.refreshTokens('STRAVA', user);

    return updated.accessToken!;
  }

  login(userId: string, next?: string) {
    const state = this.auth.signForUser({ uid: userId, p: 'STRAVA', n: crypto.randomUUID(), next: next || '/profile' });
    const url = this.buildAuthorizeUrl(state);
    return { url };
  }

  async callback(code?: string, state?: string) {
    if (!code) throw new BadRequestException('Missing ?code');
    const token = await this.exchangeCodeForToken(code);
    const decoded = this.auth.decoded(state);
    const provider = await this.upsertProviderAccount(token, decoded);
    if (!provider) throw new NotFoundException('User not created');
    const frontBase = this.config.get<string>('FRONT_APP_URL') || 'http://localhost:3001';
    const url = `${frontBase.replace(/\/+$/, '')}/profile?provider=strava&status=success`;
    return { url, statusCode: 302 };
  }

  deactivate(providerName, userId) {
    return this.provider.toggle(providerName, userId, false);
  }

  reactivate(providerName, userId) {
    return this.provider.toggle(providerName, userId, true);
  }
}
