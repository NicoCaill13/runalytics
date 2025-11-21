import { Module } from '@nestjs/common';
import { RollingBestService } from './rollingBest.service';
import { PrismaModule } from '@/infra/db/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RollingBestService],
  exports: [RollingBestService],
})
export class RollingBestModule { }
