import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { ActivityType, Provider } from '@prisma/client';

export class SyncStravaActivitiesDto {
  @IsOptional()
  @IsDateString()
  from?: string; // iso string

  @IsOptional()
  @IsDateString()
  to?: string; // iso string

  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @IsEnum(Provider)
  provider?: Provider;

  // on ne valide pas en UUID car tu es en cuid()
  @IsOptional()
  @IsString()
  goalId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take = 20;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeAnalysis = true;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includePlannedSession = true;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  perPage: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxPages: number = 10;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeStreams: boolean = true;
}
