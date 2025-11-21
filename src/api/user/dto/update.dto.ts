import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UnitSource, Gender, HeartSource, CoachPersonality, RunnerType } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  weight?: number;

  @ApiPropertyOptional({ enum: UnitSource })
  @IsOptional()
  @IsEnum(UnitSource)
  measurementUnit?: UnitSource;

  @ApiPropertyOptional({ enum: HeartSource })
  @IsOptional()
  @IsEnum(HeartSource)
  heartUnit?: HeartSource;

  @ApiPropertyOptional({ enum: CoachPersonality })
  @IsOptional()
  @IsEnum(CoachPersonality)
  coachPersonality?: CoachPersonality;

  @ApiPropertyOptional({ enum: RunnerType })
  @IsOptional()
  @IsEnum(RunnerType)
  runnerType?: RunnerType;

  @ApiPropertyOptional({ minimum: 12, maximum: 85 })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(85)
  age?: number;
}
