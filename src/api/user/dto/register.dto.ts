import { IsDate, IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';

import { Gender } from '@prisma/client';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(12)
  password!: string;

  @IsNotEmpty()
  @MinLength(5)
  userName!: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender!: Gender;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  birthDay!: Date;
}
