import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CoachPersonalityEnum, MeasurementPrefEnum, RunnerTypeEnum, SexEnum } from '@/enum';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ enum: SexEnum })
  @IsOptional()
  @IsEnum(SexEnum)
  sex?: SexEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: MeasurementPrefEnum })
  @IsOptional()
  @IsEnum(MeasurementPrefEnum)
  measurementPref?: MeasurementPrefEnum;

  @ApiPropertyOptional({ enum: CoachPersonalityEnum })
  @IsOptional()
  @IsEnum(CoachPersonalityEnum)
  coachPersonality?: CoachPersonalityEnum;

  @ApiPropertyOptional({ enum: RunnerTypeEnum })
  @IsOptional()
  @IsEnum(RunnerTypeEnum)
  runnerType?: RunnerTypeEnum;

  @ApiPropertyOptional({ minimum: 12, maximum: 85 })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(85)
  age?: number;

  @ApiPropertyOptional({ minimum: 100, maximum: 230 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(230)
  fcm?: number;

  @ApiPropertyOptional({ minimum: 30, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(120)
  fcrepos?: number;
}
