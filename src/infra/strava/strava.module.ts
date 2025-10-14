import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaOauthService } from './strava.oauth.service';
import { StravaOauthController } from './strava.oauth.controller';
import { PrismaModule } from '@/infra/db/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [StravaOauthController],
  providers: [StravaOauthService],
  exports: [StravaOauthService],
})
export class StravaModule {}
