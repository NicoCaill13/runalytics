import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StravaService } from './strava.service';
import { StravaController } from './strava.controller';
import { RollingBestModule } from '@/api/rollingBest/rollingBest.module';

@Module({
  imports: [HttpModule, RollingBestModule],
  controllers: [StravaController],
  providers: [StravaService],
  exports: [StravaService],
})
export class StravaModule { }
