import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';

@Module({
  imports: [PrismaModule],
  providers: [AnalysisService],
  controllers: [AnalysisController],
})
export class AnalysisModule {}
