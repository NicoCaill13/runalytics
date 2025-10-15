import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { WeeklyFeaturesService } from './weekly-features.service';

@Controller('analytics/weeks')
export class WeeklyFeaturesController {
  constructor(private readonly svc: WeeklyFeaturesService) {}

  @Post('compute/:userId')
  compute(@Param('userId') userId: string, @Query('since') since?: string) {
    const date = since ? new Date(since) : undefined;
    return this.svc.computeForUser(userId, date);
  }

  @Get(':userId')
  list(@Param('userId') userId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.svc.list(userId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }
}
