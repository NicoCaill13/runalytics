import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { HrZoneAnnotatorService } from './hr-zone-annotator.service';
import { HrZoneAnnotatorController } from './hr-zone-annotator.controller';

@Module({
  imports: [PrismaModule],
  providers: [HrZoneAnnotatorService],
  controllers: [HrZoneAnnotatorController],
})
export class HrZoneAnnotatorModule {}
