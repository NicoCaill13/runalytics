import { Module } from '@nestjs/common';
import { StravaOauthModule } from './oauth/strava/strava.oauth.module';

@Module({
  imports: [StravaOauthModule],
  exports: [StravaOauthModule],
})
export class ProviderModule { }
