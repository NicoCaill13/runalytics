import { Controller } from '@nestjs/common';
import { ActivitiesStreamService } from './activitiesStream.service';

@Controller('activities/stream')
export class ActivitiesStreamController {
  constructor(private readonly svc: ActivitiesStreamService) { }

  // @Post('sync-runs/:userId')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: "Récupérer toutes les activités d'un utilisateur par id" })
  // syncRuns(@Param('userId') userId: string) {
  //   return this.svc.syncUserActivities(userId);
  // }

  // // POST /activities/sync-runs/:userId
  // @Get(':userId/streams/:activityID')
  // @ApiOperation({ summary: "Récupérer toutes les activités d'un utilisateur par id" })
  // getStreams(@Param('userId') userId: string, @Param('activityID') activityID: string) {
  //   return this.svc.getStreams(userId, activityID);
  // }
}
