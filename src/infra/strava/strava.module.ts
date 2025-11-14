import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@/infra/db/prisma.module';
import { StravaService } from './strava.service';
import { AuthModule } from '@/infra/auth/auth.module';

@Module({
  imports: [HttpModule, PrismaModule, AuthModule],
  providers: [StravaService],
  exports: [StravaService],
})
export class StravaModule { }
