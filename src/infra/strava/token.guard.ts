import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { StravaOauthService } from './strava.oauth.service';

@Injectable()
export class StravaTokenGuard {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oauth: StravaOauthService,
  ) { }

  // async getFreshAccessToken(userId: string): Promise<string> {
  //   const u = await this.prisma.user.findUnique({ where: { id: userId } });
  //   if (!u?.refreshToken) throw new Error('Strava non lié');

  //   const now = Date.now();
  //   if (u.expiresAt && u.expiresAt.getTime() - now > 60_000 && u.accessToken) {
  //     return u.accessToken; // encore valide
  //   }

  //   const refreshed = await this.oauth.refreshToken(u.refreshToken);
  //   const expiresAt = new Date(refreshed.expires_at * 1000);

  //   const updated = await this.prisma.user.update({
  //     where: { id: userId },
  //     data: {
  //       athleteId: refreshed.athlete.id, // safe
  //       accessToken: refreshed.access_token,
  //       refreshToken: refreshed.refresh_token,
  //       expiresAt,
  //     },
  //   });
  //   return updated.accessToken!;
  // }
}
