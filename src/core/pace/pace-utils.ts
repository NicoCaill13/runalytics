export function mpsToKph(mps: number): number {
  return +(mps * 3.6).toFixed(2);
}
export function kphToPaceStr(kph: number): string {
  if (!kph) return '-';
  const secPerKm = Math.round(3600 / kph);
  const m = Math.floor(secPerKm / 60),
    s = secPerKm % 60;
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}
// %VMA -> kph given vma m/s
export function percentVmaToKph(percent: number, vmaMps: number): number {
  return mpsToKph(vmaMps * percent);
}
