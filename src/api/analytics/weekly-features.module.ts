import { Module } from '@nestjs/common';
import { WeeklyFeaturesService } from './weekly-features.service';

@Module({
  providers: [WeeklyFeaturesService],
  exports: [WeeklyFeaturesService],
})
export class WeeklyFeaturesModule {}
