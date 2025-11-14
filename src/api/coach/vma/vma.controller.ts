import { Controller, Get, Param, Post } from '@nestjs/common';
import { VmaService } from './vma.service';
import { VmaEstimate } from './vma.dto';

@Controller('coach/vma')
export class VmaController {
  constructor(private readonly svc: VmaService) {}

  @Post('estimate/:userId')
  estimateAndSave(@Param('userId') userId: string): Promise<VmaEstimate> {
    return this.svc.estimateAndPersist(userId);
  }

  @Get('estimate/:userId')
  estimateFromActivities(@Param('userId') userId: string): Promise<VmaEstimate> {
    return this.svc.estimateFromActivities(userId);
  }

  @Get('current/:userId')
  current(@Param('userId') userId: string) {
    return this.svc.current(userId);
  }
}
