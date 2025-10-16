import { Module } from '@nestjs/common';
import { WeeklyFeaturesService } from './weekly-features.service';
import { WeeklyFeaturesController } from './weekly-features.controller';

@Module({
  providers: [WeeklyFeaturesService],
  controllers: [WeeklyFeaturesController],
  exports: [WeeklyFeaturesService],
})
export class WeeklyFeaturesModule {}
