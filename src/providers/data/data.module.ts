import { Module } from '@nestjs/common';
import { StravaModule } from './strava/strava.module';

@Module({
  imports: [StravaModule],
  exports: [StravaModule],
})
export class DataModule { }
