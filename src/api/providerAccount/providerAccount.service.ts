import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';

@Injectable()
export class ProviderAccountService {
  constructor(private readonly prisma: PrismaService) { }

  private async hasProvider(userId: string, provider) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const row = await this.prisma.providerAccount.findFirst({ where: { userId, provider: provider.toUpperCase() }, select: { id: true } });
    return !!row;
  }

  async getProvider(userId: string, provider) {
    return await this.prisma.providerAccount.findFirst({ where: { userId, provider: provider.toUpperCase() } });
  }

  async toggle(providerName, userId, isActive: boolean) {
    const providerData = await this.getProvider(userId, providerName.toUpperCase());
    if (!providerData) {
      throw new NotFoundException(`Aucun provider "${providerName}" trouvé pour l'utilisateur ${userId}`);
    }
    const provider = providerName.toUpperCase();
    const providerUserId = String(providerData.providerUserId);

    return this.prisma.providerAccount.update({
      where: { provider_providerUserId: { provider, providerUserId } },
      data: { isActive: isActive },
    });
  }

  async refreshTokens(provider, refreshed) {
    const expiresAt = new Date(refreshed.expires_at * 1000);
    const providerUserId = String(refreshed.providerUserId);
    return await this.prisma.providerAccount.update({
      where: { provider_providerUserId: { provider, providerUserId } },
      data: { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token, expiresAt },
    });
  }

  upsertProviderAccount(parsed: any, provider, athlete, payload) {
    const athleteId = parsed.athlete.id;
    const providerUserId = String(athleteId);
    const expiresAt = new Date(parsed.expires_at * 1000);
    return this.prisma.providerAccount.upsert({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
      update: {
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token,
        expiresAt,
        isPremium: athlete.premium ?? undefined,
        isActive: true,
        profile: athlete.profile ?? undefined,
        userId: payload.user.uid,
      },
      create: {
        userId: payload.user.uid,
        provider,
        providerUserId: providerUserId,
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token,
        expiresAt,
        isPremium: athlete.premium ?? undefined,
        isActive: true,
        profile: athlete.profile ?? undefined,
      },
    });
  }
}
