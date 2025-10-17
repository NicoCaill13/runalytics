import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@/infra/db/prisma.module';
import { StravaOauthService } from './strava.oauth.service';
import { StravaOauthController } from './strava.oauth.controller';
import { StravaService } from './strava.service';
import { StravaTokenGuard } from './token.guard';
import { AuthModule } from '@/infra/auth/auth.module';

@Module({
  imports: [HttpModule, PrismaModule, AuthModule],
  controllers: [StravaOauthController],
  providers: [StravaOauthService, StravaService, StravaTokenGuard],
  exports: [StravaOauthService, StravaService, StravaTokenGuard],
})
export class StravaModule {}
