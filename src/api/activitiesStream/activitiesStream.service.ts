import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';

@Injectable()
export class ActivitiesStreamService {
  constructor(private readonly prisma: PrismaService) { }

  // ActivityStream
  // Sample
  private buildSamples(stream: any, startDate: Date) {
    const time = stream.timeSec as number[];
    const dist = stream.distanceM as number[];
    const hr = stream.heartRate as number[] | undefined;
    const alt = stream.altitudeM as number[] | undefined;

    const samples: any[] = [];

    for (let i = 0; i < time.length; i++) {
      const t = time[i]; // en secondes depuis le départ
      const d = dist[i]; // en mètres
      const h = hr ? hr[i] : undefined;
      const a = alt ? alt[i] : undefined;

      // delta distance pour la vitesse instantanée (sur 1s)
      const dPrev = i > 0 ? dist[i - 1] : 0;
      const deltaD = d - dPrev; // mètres
      const vMps = deltaD; // ~ m/s car dt = 1s
      const paceSecPerKm = vMps > 0 ? 1000 / vMps : null;

      samples.push({
        t,
        distanceM: d,
        heartRate: h,
        altitudeM: a,
        speedMps: vMps,
        paceSecPerKm,
        time: new Date(startDate.getTime() + t * 1000),
      });
    }

    return samples;
  }
}
