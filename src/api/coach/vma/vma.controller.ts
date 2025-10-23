import { Controller, Get, Param, Post } from '@nestjs/common';
import { VmaService } from './vma.service';
import { VmaEstimateDto } from '@/types/strava';

@Controller('coach/vma')
export class VmaController {
  constructor(private readonly svc: VmaService) {}

  @Post('estimate/:userId')
  estimateAndSave(@Param('userId') userId: string): Promise<VmaEstimateDto> {
    return this.svc.estimateAndPersist(userId);
  }

  @Get('estimate/:userId')
  estimateDry(@Param('userId') userId: string): Promise<VmaEstimateDto> {
    return this.svc.currentOrEstimate(userId);
  }
}
