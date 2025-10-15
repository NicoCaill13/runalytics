import { Controller, Post, Param } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly svc: ActivitiesService) {}

  // POST /activities/sync-runs/:userId
  @Post('sync-runs/:userId')
  syncRuns(@Param('userId') userId: string) {
    return this.svc.syncUserActivities(userId);
  }
}
