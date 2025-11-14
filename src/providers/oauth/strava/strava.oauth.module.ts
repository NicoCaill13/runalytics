import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaOauthService } from './strava.oauth.service';
import { StravaOauthController } from './strava.oauth.controller';
import { AuthModule } from '@/infra/auth/auth.module';
import { StravaService } from '@/infra/strava/strava.service';
import { ProviderAccountModule } from '@/api/providerAccount/providerAccount.module';

@Module({
  imports: [HttpModule, AuthModule, ProviderAccountModule],
  controllers: [StravaOauthController],
  providers: [StravaOauthService, StravaService],
  exports: [StravaOauthService, StravaService],
})
export class StravaOauthModule { }
