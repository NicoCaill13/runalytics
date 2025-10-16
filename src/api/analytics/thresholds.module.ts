// src/api/analytics/thresholds.module.ts
import { Module } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { PrismaModule } from '@/infra/db/prisma.module';
import { ThresholdsController } from './thresholds.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ThresholdsController],
  providers: [ThresholdsService],
  exports: [ThresholdsService],
})
export class ThresholdsModule {}
