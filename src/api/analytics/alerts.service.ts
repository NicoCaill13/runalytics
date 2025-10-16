import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { ThresholdsService } from '@/api/analytics/thresholds.service';

type Alert =
  | { type: 'acwr_high'; year: number; weekNumber: number; value: number; hint: string }
  | { type: 'low_days_active'; year: number; weekNumber: number; value: number; hint: string }
  | { type: 'high_monotony'; year: number; weekNumber: number; value: number; hint: string }
  | { type: 'high_daily_load'; year: number; weekNumber: number; value: number; hint: string };

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly thresholds: ThresholdsService,
  ) {}

  async forUser(userId: string): Promise<Alert[]> {
    const th = await this.thresholds.forUser(userId);
    const acwrCut = Math.max(1.5, th.acwr.p75 || 0); // perso ≥ global
    const dayCut = Math.max(150, th.day.p90 || 0);

    const weeks = await this.prisma.weeklyFeatures.findMany({
      where: { userId },
      orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
    });

    const alerts: Alert[] = [];
    for (const w of weeks) {
      // ACWR élevé (seuil perso)
      if (w.acwr != null && w.acwr > acwrCut) {
        alerts.push({
          type: 'acwr_high',
          year: w.year,
          weekNumber: w.weekNumber,
          value: +w.acwr.toFixed(2),
          hint: `ACWR élevé (> ${acwrCut.toFixed(2)}). Réduis la charge la semaine suivante de 30–50%.`,
        });
      }
      // Peu de jours actifs
      if (w.daysActive < 3) {
        alerts.push({
          type: 'low_days_active',
          year: w.year,
          weekNumber: w.weekNumber,
          value: w.daysActive,
          hint: 'Vise ≥ 3 jours actifs/semaine pour une meilleure distribution de charge.',
        });
      }
      // Monotony élevée (déjà filtrée par ta règle ≥3 jours)
      if (w.monotony != null && w.monotony >= 2.5) {
        alerts.push({
          type: 'high_monotony',
          year: w.year,
          weekNumber: w.weekNumber,
          value: +w.monotony.toFixed(2),
          hint: 'Varie l’intensité: alterne EF, tempo, et SL plutôt que des séances similaires.',
        });
      }
      // NEW: charge journalière max élevée (seuil perso)
      if (w.maxDayLoad != null && w.maxDayLoad > dayCut) {
        alerts.push({
          type: 'high_daily_load',
          year: w.year,
          weekNumber: w.weekNumber,
          value: +w.maxDayLoad.toFixed(1),
          hint: `Grosse journée (> ${dayCut.toFixed(0)} AU). Évite deux jours lourds d’affilée, récup légère le lendemain.`,
        });
      }
    }
    return alerts;
  }
}
