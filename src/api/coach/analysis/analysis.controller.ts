import { Controller, Get, Param } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('coach/analysis')
export class AnalysisController {
  constructor(private readonly svc: AnalysisService) {}

  @Get('last-run/:userId')
  lastRun(@Param('userId') userId: string) {
    return this.svc.lastRun(userId);
  }

  @Get('last-week/:userId')
  lastWeek(@Param('userId') userId: string) {
    return this.svc.lastWeek(userId);
  }
}
