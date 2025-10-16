import { Controller, Get, Param } from '@nestjs/common';
import { SummaryService } from './summary.service';

@Controller('analytics/summary')
export class SummaryController {
  constructor(private readonly svc: SummaryService) {}

  @Get(':userId')
  getSummary(@Param('userId') userId: string) {
    return this.svc.getSummary(userId);
  }
}
