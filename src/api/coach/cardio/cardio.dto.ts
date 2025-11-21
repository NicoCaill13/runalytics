import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';
import { MetricSource, ValueSource } from '@prisma/client';

export type ZoneId = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';

export type HrrZone = {
  id: 'Z1' | 'Z2' | 'Z3';
  metric: 'HRR';
  percHRR: { from: number; to: number }; // ex: 0.70–0.80
  bpm: { from: number; to: number }; // en bpm
  pace: { from: string; to: string }; // min/km, format mm:ss
  kph: { from: number; to: number };
};

export type VmaZone = {
  id: 'Z4' | 'Z5';
  metric: 'VMA';
  label: 'Seuil' | 'VO2';
  percVMA: { from: number; to: number }; // ex: 0.80–0.88
  kph: { from: number; to: number }; // km/h
  pace: { from: string; to: string }; // min/km, format mm:ss
};

export type VmaBand = {
  name: 'Endurance' | 'Marathon' | 'Seuil' | 'VO2' | 'Sprint';
  percVMA: { from: number; to: number };
  kph: { from: number; to: number };
  pace: { from: string; to: string };
};

export type ZonesResponse = {
  vmaKph: number;
  hr: { rest: number; max: number; hrr: number };
  enduranceZones: HrrZone[]; // Z1..Z3 (HRR)
  qualityZones: VmaZone[]; // Z4..Z5 (VMA)
  vmaBands: VmaBand[]; // E/M/T/I/R (VMA)
};

export type MetricSourceType = MetricSource;

export type CreateResult = { ok: true; data: any } | { ok: false; code: 'CONFLICT' | 'NOT_FOUND' | 'INVALID'; message: string };

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const paceFromKph = (kph: number) => {
  const minPerKm = 60 / kph;
  const mm = Math.floor(minPerKm);
  const ss = Math.round((minPerKm - mm) * 60);
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

export class PhysioDto {
  @IsEnum(MetricSource)
  metric: MetricSource;

  @IsEnum(ValueSource)
  source: ValueSource;

  @IsNotEmpty()
  value: number;

  @IsPositive()
  @IsOptional()
  runsCount?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  windowStart?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  windowEnd?: Date;
}
