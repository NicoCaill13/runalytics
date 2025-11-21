import { Module } from '@nestjs/common';
import { VmaModule } from './vma/vma.module';
import { CardioModule } from './cardio/cardio.module';
import { PlanModule } from './plan/plan.module';

@Module({
  imports: [VmaModule, PlanModule, CardioModule],
  exports: [VmaModule, PlanModule, CardioModule],
})
export class CoachModule {}
