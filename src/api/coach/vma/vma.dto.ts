export type VmaSource = 'ESTIMATED' | 'USER';

export enum enumVmaSource {
  ESTIMATED = 'ESTIMATED',
  USER = 'USER',
}

export class VmaEstimate {
  vmaMps: number;
  vmaKph: number;
  pacePerKm: string;
  source: VmaSource;
  confidence: number;
  runsCount: number;
  firstRun: any;
  lastRun: any;
  needsSetup?: boolean;
}
