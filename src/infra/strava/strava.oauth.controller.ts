import { Controller, Get, NotFoundException, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { StravaOauthService } from './strava.oauth.service';
import { AuthService } from '../auth/auth.service';

@Controller('auth')
export class StravaOauthController {
  constructor(
    private readonly oauth: StravaOauthService,
    private readonly auth: AuthService,
  ) {}

  @Get('login')
  login(@Res() res: Response) {
    const state = crypto.randomUUID();
    const url = this.oauth.buildAuthorizeUrl(state);
    return res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res({ passthrough: true }) res: Response) {
    const token = await this.oauth.exchangeCodeForToken(code);
    const user = await this.oauth.upsertAccount(token);
    if (!user) {
      throw new NotFoundException(`No user found for email`);
    }
    const jwt = this.auth.signForUser(user);
    return { access: jwt };
  }
}
