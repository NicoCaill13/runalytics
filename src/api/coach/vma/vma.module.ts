import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { VmaService } from './vma.service';
import { VmaController } from './vma.controller';

@Module({
  imports: [PrismaModule],
  providers: [VmaService],
  controllers: [VmaController],
  exports: [VmaService],
})
export class VmaModule {}
