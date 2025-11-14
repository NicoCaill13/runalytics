import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { CardioService } from './cardio.service';
import { CardioController } from './cardio.controller';

@Module({
  imports: [PrismaModule],
  providers: [CardioService],
  controllers: [CardioController],
  exports: [CardioService],
})
export class CardioModule {}
