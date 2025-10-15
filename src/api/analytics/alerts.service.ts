import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';

type Alert =
  | { type: 'acwr_high'; year: number; weekNumber: number; value: number; hint: string }
  | { type: 'low_days_active'; year: number; weekNumber: number; value: number; hint: string }
  | { type: 'high_monotony'; year: number; weekNumber: number; value: number; hint: string };

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async forUser(userId: string): Promise<Alert[]> {
    const weeks = await this.prisma.weeklyFeatures.findMany({
      where: { userId },
      orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
    });

    const alerts: Alert[] = [];
    for (const w of weeks) {
      // ACWR élevé
      if (w.acwr != null && w.acwr > 1.5) {
        alerts.push({
          type: 'acwr_high',
          year: w.year,
          weekNumber: w.weekNumber,
          value: +w.acwr.toFixed(2),
          hint: 'Réduis ta charge la semaine suivante de 30–50% pour éviter la surcharge.',
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
      // Monotony encore élevée (même avec nouvelle règle)
      if (w.monotony != null && w.monotony >= 2.5) {
        alerts.push({
          type: 'high_monotony',
          year: w.year,
          weekNumber: w.weekNumber,
          value: +w.monotony.toFixed(2),
          hint: 'Varie l’intensité: alterne EF, tempo, et SL plutôt que des séances similaires.',
        });
      }
    }
    return alerts;
  }
}
