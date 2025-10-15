import { computeSessionLoad } from './load';

const base = {
  providerActivityId: 'x',
  provider: 'strava',
  dateUtc: new Date().toISOString(),
  dateLocal: new Date().toISOString(),
  distanceM: 10000,
  movingTimeS: 3600,
  elevGainM: 0,
  sport: 'run',
} as any;

test('load sans FC ~ 100 AU pour 1h à 2.8 m/s', () => {
  const act = { ...base, distanceM: 10080, movingTimeS: 3600 }; // 2.8 m/s
  const load = computeSessionLoad(act, { heartRateStatus: 'none' });
  expect(load).toBeGreaterThanOrEqual(95);
  expect(load).toBeLessThanOrEqual(105);
});

test('load FC ready: 1h à 170 bpm ≈ 100 AU', () => {
  const act = { ...base, avgHr: 170 };
  const load = computeSessionLoad(act, { heartRateStatus: 'ready', hrRef: 170 });
  expect(load).toBeGreaterThanOrEqual(95);
  expect(load).toBeLessThanOrEqual(105);
});

test('cap des ratios (haut/bas)', () => {
  const fast = { ...base, distanceM: 3600 * 4.5 }; // 4.5 m/s
  const slow = { ...base, distanceM: 3600 * 1.2 }; // 1.2 m/s
  const lFast = computeSessionLoad(fast, { heartRateStatus: 'none', refPace: 2.8 });
  const lSlow = computeSessionLoad(slow, { heartRateStatus: 'none', refPace: 2.8 });
  expect(lFast).toBeCloseTo(150, 0); // cap à 1.5
  expect(lSlow).toBeCloseTo(70, 0); // cap à 0.7
});
