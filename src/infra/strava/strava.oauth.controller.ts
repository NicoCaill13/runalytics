import { BadRequestException, Controller, Get, NotFoundException, Param, Query, Redirect, Req, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { StravaOauthService } from './strava.oauth.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('strava')
export class StravaOauthController {
  constructor(
    private readonly oauth: StravaOauthService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('login')
  getLogin(@Req() req: any, @Query('next') next?: string) {
    const userId: string = req.user?.id || req.user?.sub;
    const state = this.auth.signForUser({ uid: userId, p: 'STRAVA', n: crypto.randomUUID(), next: next || '/profile' });
    const url = this.oauth.buildAuthorizeUrl(state);
    return { url };
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('code') code?: string, @Query('state') state?: string) {
    if (!code) throw new BadRequestException('Missing ?code');

    const token = await this.oauth.exchangeCodeForToken(code);
    const decoded = this.auth.decoded(state);
    const provider = await this.oauth.upsertProviderAccount(token, decoded);
    if (!provider) throw new NotFoundException('User not created');

    // const jwt = this.auth.signForUser(provider);
    const frontBase = this.config.get<string>('FRONT_APP_URL') || 'http://localhost:3001';

    const url = `${frontBase.replace(/\/+$/, '')}/profile?provider=strava&status=success`;
    return { url, statusCode: 302 };
  }

  @Get('deactivate/:provider/:userId')
  async deactivate(@Param('provider') provider: string, @Param('userId') userId: string) {
    return this.oauth.deactivate(provider, userId);
  }

  @Get('reactivate/:provider/:userId')
  async reactivate(@Param('provider') provider: string, @Param('userId') userId: string) {
    return this.oauth.reactivate(provider, userId);
  }
}
