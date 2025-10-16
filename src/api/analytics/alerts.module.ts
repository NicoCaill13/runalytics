import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ThresholdsModule } from '@/api/analytics/thresholds.module';
import { AlertsController } from './alerts.controller';

@Module({
  imports: [ThresholdsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
