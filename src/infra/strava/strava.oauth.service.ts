import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { StravaTokenResponseSchema, StravaTokenResponse } from './strava.oauth.dto';
import { PrismaService } from '@/infra/db/prisma.service';

@Injectable()
export class StravaOauthService {
  private readonly oauthUrl = 'https://www.strava.com/oauth';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  buildAuthorizeUrl(state: string) {
    const clientId = this.config.get<string>('strava.clientId')!;
    const redirectUri = this.config.get<string>('strava.redirectUri')!;
    const scope = 'read,activity:read_all'; // élargir si besoin

    const url =
      `${this.oauthUrl}/authorize?client_id=${clientId}` +
      `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;

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

  async upsertAccount(parsed: StravaTokenResponse) {
    const expiresAt = new Date(parsed.expires_at * 1000);
    const email = parsed.athlete.email ?? undefined;

    // Crée l'utilisateur s'il n'existe pas
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Lie le compte Strava
    await this.prisma.stravaAccount.upsert({
      where: { userId: user.id },
      update: {
        athleteId: parsed.athlete.id,
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token,
        expiresAt,
      },
      create: {
        userId: user.id,
        athleteId: parsed.athlete.id,
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token,
        expiresAt,
      },
    });

    return user;
  }
}
