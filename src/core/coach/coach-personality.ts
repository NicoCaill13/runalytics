import { CoachPersonality } from '@/types/strava';

export function formatMessage(p: CoachPersonality, base: string): string {
  if (p === 'COOL') {
    return (
      '🌿 ' +
      base
        .replace(/trop|très élevé/g, 'un peu fort')
        .replace(/attention/g, 'garde un œil')
        .replace(/\.$/, ', mais tu progresses !')
    );
  }
  if (p === 'COMPET') {
    return (
      '🔥 ' +
      base
        .replace(/bonne semaine/g, 'semaine correcte, mais exige-toi mieux')
        .replace(/attention/g, 'STOP — corrige ça maintenant')
        .replace(/\.$/, ' !')
    );
  }
  return base;
}
