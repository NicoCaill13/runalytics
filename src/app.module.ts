import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/shared/config/configuration';
import { EnvSchema } from '@/shared/config/validation';
import { StravaModule } from './infra/strava/strava.module';
import { PrismaModule } from './infra/db/prisma.module';
import { ActivitiesModule } from '@/api/activities/activities.module';
import { WeeklyFeaturesModule } from '@/api/analytics/weekly-features.module';
import { AlertsModule } from '@/api/analytics/alerts.module';
import { ThresholdsModule } from '@/api/analytics/thresholds.module';
import { SummaryModule } from '@/api/analytics/summary.module';
import { CoachModule } from '@/api/coach/coach.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: (env) => EnvSchema.parse(env),
    }),
    StravaModule,
    PrismaModule,
    ActivitiesModule,
    WeeklyFeaturesModule,
    AlertsModule,
    ThresholdsModule,
    SummaryModule,
    CoachModule,
    UserModule,
  ],
})
export class AppModule {}
