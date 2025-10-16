import { Controller, Post, Param } from '@nestjs/common';
import { HrZoneAnnotatorService } from './hr-zone-annotator.service';

@Controller('coach/hr-annotate')
export class HrZoneAnnotatorController {
  constructor(private readonly svc: HrZoneAnnotatorService) {}

  @Post(':userId')
  run(@Param('userId') userId: string) {
    return this.svc.annotate(userId);
  }
}
