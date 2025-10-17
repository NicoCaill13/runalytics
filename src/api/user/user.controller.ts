import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseDto } from './user.dto';

@Controller('me')
export class UserController {
  constructor(private readonly svc: UserService) {}

  // Version avec auth (req.user.id) si tu as un guard
  @Get('me/auth')
  async me(@Req() req: any): Promise<UserResponseDto> {
    const userId = req.user?.id || req.headers['x-user-id']; // fallback pratique pour tester
    if (!userId) throw new Error('No user in request. Provide x-user-id for testing.');
    return this.svc.getByUserId(String(userId));
  }

  // Fallback pratique sans auth, pour curl
  @Get(':userId')
  async meById(@Param('userId') userId: string): Promise<UserResponseDto> {
    return this.svc.getByUserId(userId);
  }

  @Patch(':userId')
  async updateProfile(@Param('userId') userId: string, @Body() body: { age?: number; fcm?: number; fcrepos?: number; vmaMps?: number }) {
    return this.svc.updateUserMetrics(userId, body);
  }
}
