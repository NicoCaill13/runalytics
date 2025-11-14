import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CardioService } from './cardio.service';
import { ZonesResponse, PhysioDto } from './cardio.dto';

@Controller('coach/cardio')
export class CardioController {
  constructor(private readonly svc: CardioService) { }

  @Get('zones/:userId')
  async computeZones(@Param('userId') userId: string): Promise<ZonesResponse> {
    return this.svc.computeZones(userId);
  }

  @Post(':userId')
  create(@Param('userId') userId: string, @Body() dto: PhysioDto) {
    return this.svc.createPhysioValue(userId, dto);
  }
}
