export type DayLoads = number[];

export function startOfIsoWeek(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7; // 1..7 (Mon..Sun)
  if (day !== 1) x.setUTCDate(x.getUTCDate() - (day - 1));
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function getIsoWeekYear(date: Date): { year: number; weekNumber: number } {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // ISO week algorithm
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const year = tmp.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const weekNumber = Math.ceil(((+tmp - +yearStart) / 86400000 + 1) / 7);
  return { year, weekNumber };
}

export function monotony(dayLoads: number[]): number | null {
  const active = dayLoads.filter((x) => x > 0);
  if (active.length < 3) return null;
  const mean = active.reduce((a, b) => a + b, 0) / active.length;
  const variance = active.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / active.length;
  const sd = Math.sqrt(variance);
  if (sd === 0) return null;
  return Math.min(3.5, mean / sd);
}

export function strain(loadWeek: number, mono: number | null): number | null {
  return mono == null ? null : loadWeek * mono;
}
