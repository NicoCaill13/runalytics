import { CoachPersonalityEnum, MeasurementPrefEnum, RunnerTypeEnum, SexEnum } from '@/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface UserResponseDto {
  user: {
    id: string;
    username: string | null;
    sex: 'M' | 'F' | null;
    profile: string | null;
    profileMedium: string | null;
    city: string | null;
    country: string | null;
    measurementPref: 'meters' | 'feet' | null;
    coachPersonality: 'COOL' | 'MODERATE' | 'COMPET' | null;
    runnerType: 'PLEASURE' | 'PROGRESS' | 'COMPETITOR' | null;
  };
  thresholds: {
    loadWeek: { p50: number; p75: number };
    acwr: { p50: number; p75: number };
    day: { p50: number; p75: number; p90: number };
  } | null;
  insights: string[];
}

export class UserDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() username!: string | null;

  @ApiPropertyOptional({ enum: SexEnum, nullable: true })
  sex!: SexEnum | null;

  @ApiPropertyOptional() profile!: string | null;
  @ApiPropertyOptional() profileMedium!: string | null;
  @ApiPropertyOptional() city!: string | null;
  @ApiPropertyOptional() country!: string | null;

  @ApiPropertyOptional({ enum: MeasurementPrefEnum, nullable: true })
  measurementPref!: MeasurementPrefEnum | null;

  @ApiPropertyOptional({ enum: CoachPersonalityEnum, nullable: true })
  coachPersonality!: CoachPersonalityEnum | null;

  @ApiPropertyOptional({ enum: RunnerTypeEnum, nullable: true })
  runnerType!: RunnerTypeEnum | null;

  @ApiPropertyOptional() age!: number | null;

  @ApiPropertyOptional() createdAt!: string | null;
  @ApiPropertyOptional() updatedAt!: string | null;
}
