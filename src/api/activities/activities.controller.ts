import { Controller, Post, Param, UseGuards, Get } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '@/infra/auth/jwt.guard';
import { ApiOperation } from '@nestjs/swagger';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly svc: ActivitiesService) { }

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
