import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { StravaOauthService } from './strava.oauth.service';

@Injectable()
export class StravaTokenGuard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oauth: StravaOauthService,
  ) {}

  async getFreshAccessToken(userId: string): Promise<string> {
    const acc = await this.prisma.stravaAccount.findUnique({ where: { userId } });
    if (!acc) throw new Error('Strava account not linked');

    const now = Date.now();
    if (acc.expiresAt.getTime() - now > 60_000) {
      return acc.accessToken; // >1 min restant → ok
    }

    const refreshed = await this.oauth.refreshToken(acc.refreshToken);
    await this.prisma.stravaAccount.update({
      where: { userId },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: new Date(refreshed.expires_at * 1000),
        athleteId: refreshed.athlete.id,
      },
    });
    return refreshed.access_token;
  }
}
