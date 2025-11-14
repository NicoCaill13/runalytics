import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infra/db/prisma.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';

const EXPIRES_IN_SECONDS = Number.parseInt(process.env.JWT_EXPIRES_IN ?? '', 10) || 60 * 60 * 24; // 1 jour

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: EXPIRES_IN_SECONDS },
    }),
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
