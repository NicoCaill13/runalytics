import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { VmaService } from './vma.service';
import { VmaEstimateDto } from '@/shared/types/strava';

@Controller('coach/vma')
export class VmaController {
  constructor(private readonly svc: VmaService) {}

  @Post('estimate/:userId')
  estimateAndSave(@Param('userId') userId: string, @Query('force') force?: string): Promise<VmaEstimateDto> {
    const doForce = force === 'true' || force === '1';
    return this.svc.estimateAndPersist(userId, doForce);
  }

  @Get('estimate/:userId')
  estimateDry(@Param('userId') userId: string): Promise<VmaEstimateDto> {
    return this.svc.currentOrEstimate(userId);
  }
}
