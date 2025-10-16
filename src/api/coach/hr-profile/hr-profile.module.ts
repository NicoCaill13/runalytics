import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { HrProfileService } from './hr-profile.service';
import { HrProfileController } from './hr-profile.controller';

@Module({
  imports: [PrismaModule],
  providers: [HrProfileService],
  controllers: [HrProfileController],
  exports: [HrProfileService],
})
export class HrProfileModule {}
