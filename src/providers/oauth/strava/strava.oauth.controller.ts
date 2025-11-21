import { Controller, Get, Param, Query, Redirect, Req, UseGuards } from '@nestjs/common';
import { StravaOauthService } from './strava.oauth.service';
import { JwtAuthGuard } from '../../../infra/auth/jwt.guard';

@Controller('oauth/strava')
export class StravaOauthController {
  constructor(private readonly oauth: StravaOauthService) { }

  @UseGuards(JwtAuthGuard)
  @Get('login')
  getLogin(@Req() req: any, @Query('next') next?: string) {
    const userId: string = req.user?.id || req.user?.sub;
    return this.oauth.login(userId, next);
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('code') code?: string, @Query('state') state?: string) {
    return await this.oauth.callback(code, state);
  }

  @UseGuards(JwtAuthGuard)
  @Get('deactivate/:userId')
  deactivate(@Param('userId') userId: string) {
    return this.oauth.deactivate('STRAVA', userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reactivate/:userId')
  reactivate(@Param('userId') userId: string) {
    return this.oauth.reactivate('STRAVA', userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('refresh/:userId')
  getFreshAccessToken(@Param('userId') userId: string) {
    return this.oauth.getFreshAccessToken(userId);
  }
}
