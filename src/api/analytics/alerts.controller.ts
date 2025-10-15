import { Controller, Get, Param } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('analytics/alerts')
export class AlertsController {
  constructor(private readonly svc: AlertsService) {}

  @Get(':userId')
  list(@Param('userId') userId: string) {
    return this.svc.forUser(userId);
  }
}
