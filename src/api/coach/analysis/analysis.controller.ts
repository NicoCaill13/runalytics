import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '@/infra/auth/jwt.guard';

@Controller('coach/analysis')
export class AnalysisController {
  constructor(private readonly svc: AnalysisService) {}

  @Get('last-run/:userId')
  @UseGuards(JwtAuthGuard)
  lastRun(@Param('userId') userId: string) {
    return this.svc.lastRun(userId);
  }

  @Get('last-week/:userId')
  @UseGuards(JwtAuthGuard)
  lastWeek(@Param('userId') userId: string) {
    return this.svc.lastWeek(userId);
  }
}
