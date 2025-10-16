import { Controller, Get, Param } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';

@Controller('analytics/thresholds')
export class ThresholdsController {
  constructor(private readonly svc: ThresholdsService) {}
  @Get(':userId') get(@Param('userId') userId: string) {
    return this.svc.forUser(userId);
  }
}
