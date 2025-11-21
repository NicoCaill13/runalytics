import { Controller, Param, Post } from '@nestjs/common';
import { VmaService } from './vma.service';

@Controller('coach/vma')
export class VmaController {
  constructor(private readonly svc: VmaService) { }

  // @Post('estimate/:userId')
  // estimateAndSave(@Param('userId') userId: string): Promise<VmaEstimate> {
  //   return this.svc.estimateAndPersist(userId);
  // }

  @Post(':userId')
  async estimateFromActivities(@Param('userId') userId: string) {
    return await this.svc.getOrEstimateVmaKph(userId);
  }

  // @Get('current/:userId')
  // current(@Param('userId') userId: string) {
  //   return this.svc.current(userId);
  // }
}
