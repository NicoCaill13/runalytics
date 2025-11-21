import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/shared/config/configuration';
import { EnvSchema } from '@/shared/config/validation';
import { StravaModule } from './providers/data/strava/strava.module';
import { PrismaModule } from './infra/db/prisma.module';
//import { ActivitiesModule } from '@/api/activities/activities.module';
import { CoachModule } from '@/api/coach/coach.module';
import { UserModule } from '@/api/user/user.module';
import { OauthModule } from './providers/oauth/oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: (env) => EnvSchema.parse(env),
    }),
    StravaModule,
    PrismaModule,
    // ActivitiesModule,
    CoachModule,
    UserModule,
    OauthModule,
  ],
})
export class AppModule { }
