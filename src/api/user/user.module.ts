import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { ThresholdsModule } from '@/api/analytics/thresholds.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, ThresholdsModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
