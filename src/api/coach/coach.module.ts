import { Module } from '@nestjs/common';
import { HrProfileModule } from './hr-profile/hr-profile.module';
import { HrZoneAnnotatorModule } from './hr-zone/hr-zone-annotator.module';
import { VmaModule } from './vma/vma.module';
import { PlanModule } from './plan/plan.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [HrProfileModule, HrZoneAnnotatorModule, VmaModule, PlanModule, AnalysisModule],
  exports: [HrProfileModule, HrZoneAnnotatorModule, VmaModule, PlanModule, AnalysisModule],
})
export class CoachModule {}
