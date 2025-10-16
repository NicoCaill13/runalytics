import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { ThresholdsModule } from '@/api/analytics/thresholds.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [PrismaModule, ThresholdsModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
