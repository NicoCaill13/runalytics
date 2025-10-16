import { VmaSource } from '@/shared/types/strava';

export interface VmaEstimateDto {
  vmaMps: number;
  vmaKph: number;
  pacePerKm: string;
  source: VmaSource;
  confidence: number; // 0..1
}
