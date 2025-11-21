import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update.dto';

@Controller('users')
export class UserController {
  constructor(private readonly svc: UserService) { }

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
  async updateUser(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.svc.updateUser(userId, dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.svc.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.svc.login(dto);
  }
}

//nicolas@smilers.com
//theo&elena13
