export function mpsToKph(mps: number): number {
  return +(mps * 3.6).toFixed(2);
}
export function kphToPaceStr(kph: number): string {
  if (!kph) return '-';
  const sPerKm = Math.round(3600 / kph);
  const m = Math.floor(sPerKm / 60);
  const s = (sPerKm % 60).toString().padStart(2, '0');
  return `${m}:${s}/km`;
}
// %VMA -> kph given vma m/s
export function percentVmaToKph(percent: number, vmaMps: number): number {
  return mpsToKph(vmaMps * percent);
}
