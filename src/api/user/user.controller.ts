import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto, UserResponseDto } from './dto/user.dto';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('me')
export class UserController {
  constructor(private readonly svc: UserService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Récupérer un utilisateur par id' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  async meById(@Param('userId') userId: string) {
    return this.svc.getByUserId(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (champs profil généraux)' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  async updateProfile(@Param('userId') userId: string, @Body() body: { age?: number; fcm?: number; fcrepos?: number; vmaMps?: number }) {
    return this.svc.updateUserMetrics(userId, body);
  }
}
