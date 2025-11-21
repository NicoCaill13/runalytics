import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaOauthService } from './strava.oauth.service';
import { StravaOauthController } from './strava.oauth.controller';
import { AuthModule } from '@/infra/auth/auth.module';
import { ProviderAccountModule } from '@/api/providerAccount/providerAccount.module';
import { ConfigModule } from '@nestjs/config';
import { StravaModule } from '@/providers/data/strava/strava.module';

@Module({
  imports: [HttpModule, AuthModule, ProviderAccountModule, ConfigModule, StravaModule],
  controllers: [StravaOauthController],
  providers: [StravaOauthService],
  exports: [StravaOauthService],
})
export class StravaOauthModule { }
