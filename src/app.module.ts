import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/shared/config/configuration';
import { EnvSchema } from '@/shared/config/validation';
import { StravaModule } from './infra/strava/strava.module';
import { PrismaModule } from './infra/db/prisma.module';
import { ActivitiesModule } from '@/api/activities/activities.module';
import { WeeklyFeaturesModule } from '@/api/analytics/weekly-features.module';
import { WeeklyFeaturesController } from '@/api/analytics/weekly-features.controller';
import { AlertsModule } from '@/api/analytics/alerts.module';
import { AlertsController } from '@/api/analytics/alerts.controller';

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
  ],
  controllers: [WeeklyFeaturesController, AlertsController],
})
export class AppModule {}
