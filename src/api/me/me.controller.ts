import { Controller, Get, Param, Req } from '@nestjs/common';
import { MeService } from './me.service';
import { MeResponseDto } from './me.dto';

@Controller()
export class MeController {
  constructor(private readonly svc: MeService) {}

  // Version avec auth (req.user.id) si tu as un guard
  @Get('me')
  async me(@Req() req: any): Promise<MeResponseDto> {
    const userId = req.user?.id || req.headers['x-user-id']; // fallback pratique pour tester
    if (!userId) throw new Error('No user in request. Provide x-user-id for testing.');
    return this.svc.getByUserId(String(userId));
  }

  // Fallback pratique sans auth, pour curl
  @Get('me/:userId')
  async meById(@Param('userId') userId: string): Promise<MeResponseDto> {
    return this.svc.getByUserId(userId);
  }
}
