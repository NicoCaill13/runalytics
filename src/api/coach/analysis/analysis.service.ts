import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { formatMessage } from '@/core/coach/coach-personality';

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async lastRun(userId: string) {
    const [user, act] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.activity.findFirst({
        where: { userId, sport: 'Run' },
        orderBy: { dateUtc: 'desc' },
      }),
    ]);
    if (!user || !act) throw new Error('No data');

    // Type guess: by hrZone or %VMA
    let typeGuess: 'EF' | 'Tempo' | 'VO2' | 'SL' = 'EF';
    if (act.hrZone === 'z4') typeGuess = 'Tempo';
    if (act.hrZone === 'z5') typeGuess = 'VO2';
    if ((act.distanceM ?? 0) > 18000) typeGuess = 'SL';

    // Verdict (simple): compare zone attendue EF vs HR/pace
    let base = 'Bonne séance, exécution cohérente.';
    if (typeGuess === 'EF' && act.hrZone && ['z3', 'z4', 'z5'].includes(act.hrZone)) {
      base = 'Tu as couru trop haut pour de l’EF : reste en Z2 pour construire la base.';
    }
    if (typeGuess === 'Tempo' && act.hrZone && ['z1', 'z2'].includes(act.hrZone)) {
      base = 'Séance tempo trop facile : vise Z3/Z4 pour un vrai stimulus.';
    }

    const msg = formatMessage((user.coachPersonality ?? 'MODERATE') as any, base);

    return {
      activityId: act.id,
      typeGuess,
      hrZone: act.hrZone,
      distanceKm: +((act.distanceM ?? 0) / 1000).toFixed(2),
      load: act.load ?? null,
      verdict: msg,
    };
  }

  async lastWeek(userId: string) {
    const [user, week] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.weeklyFeatures.findFirst({
        where: { userId },
        orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      }),
    ]);
    if (!user || !week) throw new Error('No weekly data');

    // Cibles simplifiées par runnerType
    const type = user.runnerType ?? 'PROGRESS';
    const targets: Record<string, [number, number]> = {
      PLEASURE: [150, 250],
      PROGRESS: [250, 400],
      COMPETITOR: [350, 550],
    };
    const [lo, hi] = targets[type] ?? targets.PROGRESS;

    let base = `Semaine à ${week.loadWeek} AU.`;
    if (week.loadWeek < lo) base += ' Sous la cible — augmente doucement.';
    else if (week.loadWeek > hi) base += ' Au-dessus de la cible — récup nécessaire.';
    else base += ' Dans la cible — continue !';

    if (week.acwr != null && week.acwr > 1.5) base += ' ACWR élevé : allège 30–50% la semaine suivante.';
    if (week.monotony != null && week.monotony > 2.5) base += ' Monotonie haute : varie les intensités.';

    return {
      year: week.year,
      weekNumber: week.weekNumber,
      loadWeek: week.loadWeek,
      acwr: week.acwr,
      monotony: week.monotony,
      verdict: formatMessage((user.coachPersonality ?? 'MODERATE') as any, base),
    };
  }
}
