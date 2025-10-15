import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { StravaModule } from '@/infra/strava/strava.module';
import { WeeklyFeaturesModule } from '@/api/analytics/weekly-features.module';

@Module({
  imports: [StravaModule, WeeklyFeaturesModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
