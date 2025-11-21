// src/strava/strava.controller.ts
import { Body, Controller, Param, Post } from '@nestjs/common';
import { StravaService } from './strava.service';
import { SyncStravaActivitiesDto } from './sync-strava-activities.dto';

@Controller('activities/strava')
export class StravaController {
  constructor(private readonly stravaService: StravaService) { }

  @Post('accounts/:accountId/sync')
  async syncAccount(@Param('accountId') accountId: string, @Body() body: SyncStravaActivitiesDto) {
    return this.stravaService.syncAccountActivities(accountId, body);
  }
}
