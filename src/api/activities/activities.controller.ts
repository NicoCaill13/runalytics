import { Controller, Post, Param } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly svc: ActivitiesService) {}

  // exemple: POST /activities/sync/:userId
  @Post('sync/:userId')
  sync(@Param('userId') userId: string) {
    return this.svc.syncUserActivities(userId);
  }
}
