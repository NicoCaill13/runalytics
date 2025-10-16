import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { ThresholdsModule } from './thresholds.module';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';

@Module({
  imports: [PrismaModule, ThresholdsModule],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
