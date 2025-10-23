import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { StravaTokenResponseSchema, StravaTokenResponse } from './strava.oauth.dto';
import { PrismaService } from '@/infra/db/prisma.service';
import { StravaService } from './strava.service';

@Injectable()
export class StravaOauthService {
  private readonly oauthUrl = 'https://www.strava.com/oauth';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly strava: StravaService,
  ) {}

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
    const athleteId = parsed.athlete.id;
    const expiresAt = new Date(parsed.expires_at * 1000);
    const athlete = await this.strava.getLoggedInAthlete(parsed.access_token);

    const existing = await this.prisma.user.findUnique({ where: { athleteId } });
    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          accessToken: parsed.access_token,
          refreshToken: parsed.refresh_token,
          expiresAt,
          userName: parsed.athlete.username ?? null,
          sex: athlete.sex ?? undefined,
          profile: athlete.profile ?? undefined,
          profileMedium: athlete.profile_medium ?? undefined,
          city: athlete.city ?? undefined,
          state: athlete.state ?? undefined,
          country: athlete.country ?? undefined,
          measurementPref: athlete.measurement_preference ?? undefined,
          isPremium: athlete.premium ?? undefined,
        },
      });
      return this.prisma.user.findUnique({ where: { id: existing.id } });
    }
    // Créer un User lié Strava (sans email)
    return this.prisma.user.create({
      data: {
        athleteId,
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token,
        expiresAt,
        userName: parsed.athlete.username ?? null,
        sex: athlete.sex ?? undefined,
        profile: athlete.profile ?? undefined,
        profileMedium: athlete.profile_medium ?? undefined,
        city: athlete.city ?? undefined,
        state: athlete.state ?? undefined,
        country: athlete.country ?? undefined,
        measurementPref: athlete.measurement_preference ?? undefined,
        isPremium: athlete.premium ?? undefined,
      },
    });
  }
}
