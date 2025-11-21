import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { ActivitiesStreamController } from './activitiesStream.controller';
import { ActivitiesStreamService } from './activitiesStream.service';

@Module({
  imports: [PrismaModule],
  providers: [ActivitiesStreamService],
  controllers: [ActivitiesStreamController],
})
export class AnalysisModule { }
