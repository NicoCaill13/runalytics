import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/infra/db/prisma.service';
import { convertPrismaDecimals } from '@/shared/decimal.util';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) { }

  private cleanPatch<T extends Record<string, any>>(obj: T): T {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) out[k] = v;
    }
    return out;
  }

  private signToken(user: { id: string }) {
    return this.jwt.sign({ id: user.id });
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: passwordHash,
        userName: dto.userName,
        gender: dto.gender,
        birthDay: dto.birthDay,
      },
      select: { id: true, email: true, userName: true, createdAt: true },
    });

    const accessToken = this.signToken({ id: user.id });
    return { user, accessToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, email: true, password: true, userName: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.signToken({ id: user.id });
    // on masque le hash dans la réponse
    const { password, ...safe } = user as any;
    return { user: safe, accessToken };
  }

  async getByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        physioHistory: true,
        providerAccounts: {
          select: { provider: true, providerUserId: true, isActive: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return convertPrismaDecimals(user);
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data = this.cleanPatch({
      userName: dto.userName?.trim(),
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      gender: dto.gender,
      weight: dto.weight,
      age: dto.age,
      measurementUnit: dto.measurementUnit,
      heartUnit: dto.heartUnit,
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return { updated };
  }
}
