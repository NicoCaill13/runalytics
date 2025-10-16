import { Controller, Get, Param } from '@nestjs/common';
import { PlanService } from './plan.service';

@Controller('coach/plan')
export class PlanController {
  constructor(private readonly svc: PlanService) {}
  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.svc.planForUser(userId);
  }
}
