import { Module } from '@nestjs/common';
import { VmaModule } from './vma/vma.module';
import { PlanModule } from './plan/plan.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [VmaModule, PlanModule, AnalysisModule],
  exports: [VmaModule, PlanModule, AnalysisModule],
})
export class CoachModule {}
