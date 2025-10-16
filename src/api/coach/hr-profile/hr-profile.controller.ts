import { Controller, Post, Param } from '@nestjs/common';
import { HrProfileService } from './hr-profile.service';

@Controller('coach/hr-profile')
export class HrProfileController {
  constructor(private readonly svc: HrProfileService) {}

  @Post('rebuild/:userId')
  rebuild(@Param('userId') userId: string) {
    return this.svc.rebuild(userId);
  }
}
