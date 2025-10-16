import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';

@Module({
  imports: [PrismaModule],
  providers: [PlanService],
  controllers: [PlanController],
})
export class PlanModule {}
