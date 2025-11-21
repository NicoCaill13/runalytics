import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RunnerType, CoachPersonality, UnitSource, Gender } from '@prisma/client';

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
}

export class UserDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() username!: string | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  sex!: Gender | null;

  @ApiPropertyOptional() profile!: string | null;
  @ApiPropertyOptional() profileMedium!: string | null;
  @ApiPropertyOptional() city!: string | null;
  @ApiPropertyOptional() country!: string | null;

  @ApiPropertyOptional({ enum: UnitSource, nullable: true })
  measurementPref!: UnitSource | null;

  @ApiPropertyOptional({ enum: CoachPersonality, nullable: true })
  coachPersonality!: CoachPersonality | null;

  @ApiPropertyOptional({ enum: RunnerType, nullable: true })
  runnerType!: RunnerType | null;

  @ApiPropertyOptional() age!: number | null;

  @ApiPropertyOptional() createdAt!: string | null;
  @ApiPropertyOptional() updatedAt!: string | null;
}
