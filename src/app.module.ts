import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/shared/config/configuration';
import { EnvSchema } from '@/shared/config/validation';
import { StravaModule } from './infra/strava/strava.module';
import { PrismaModule } from './infra/db/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: (env) => EnvSchema.parse(env),
    }),
    StravaModule,
    PrismaModule,
  ],
})
export class AppModule {}
