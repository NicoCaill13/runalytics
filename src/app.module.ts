import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/shared/config/configuration';
import { EnvSchema } from '@/shared/config/validation';
import { StravaModule } from './infra/strava/strava.module';
import { PrismaModule } from './infra/db/prisma.module';
import { ActivitiesModule } from '@/api/activities/activities.module';

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
  ],
})
export class AppModule {}
