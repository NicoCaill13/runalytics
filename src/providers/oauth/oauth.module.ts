import { Module } from '@nestjs/common';
import { StravaOauthModule } from './strava/strava.oauth.module';

@Module({
  imports: [StravaOauthModule],
  exports: [StravaOauthModule],
})
export class OauthModule { }
