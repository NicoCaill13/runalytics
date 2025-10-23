import { BadRequestException, Controller, Get, NotFoundException, Query, Redirect, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { StravaOauthService } from './strava.oauth.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class StravaOauthController {
  constructor(
    private readonly oauth: StravaOauthService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('login-url')
  getLoginUrl() {
    const state = crypto.randomUUID();
    const url = this.oauth.buildAuthorizeUrl(state);
    return { url };
  }

  @Get('login')
  @Redirect()
  login() {
    const state = crypto.randomUUID();
    const url = this.oauth.buildAuthorizeUrl(state);
    return { url, statusCode: 302 };
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('code') code?: string, @Query('state') state?: string) {
    if (!code) throw new BadRequestException('Missing ?code');

    const token = await this.oauth.exchangeCodeForToken(code);
    const user = await this.oauth.upsertAccount(token);
    if (!user) throw new NotFoundException('User not created');

    const jwt = this.auth.signForUser(user);
    const frontBase = this.config.get<string>('FRONT_APP_URL') || 'http://localhost:3001';

    const url = `${frontBase.replace(/\/+$/, '')}/login/callback?token=${encodeURIComponent(jwt)}`;
    return { url, statusCode: 302 };
  }
}
