import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { StravaOauthService } from './strava.oauth.service';

@Controller('auth/strava')
export class StravaOauthController {
  constructor(private readonly oauth: StravaOauthService) {}

  @Get('login')
  login(@Res() res: Response) {
    const state = crypto.randomUUID();
    const url = this.oauth.buildAuthorizeUrl(state);
    return res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    const token = await this.oauth.exchangeCodeForToken(code);
    await this.oauth.upsertAccount(token);
    return res.redirect('/');
  }
}
