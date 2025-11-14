import { Module } from '@nestjs/common';
import { ProviderAccountController } from './providerAccount.controller';
import { ProviderAccountService } from './providerAccount.service';
import { PrismaModule } from '@/infra/db/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProviderAccountController],
  providers: [ProviderAccountService],
  exports: [ProviderAccountService],
})
export class ProviderAccountModule { }
