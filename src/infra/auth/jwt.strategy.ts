import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      ignoreExpiration: false,
    });
  }
  validate(payload: { sub: string }) {
    const id = (payload as any)?.sub ?? (payload as any)?.id ?? (payload as any)?.user?.id ?? (payload as any)?.userId;

    const email = (payload as any)?.email ?? (payload as any)?.user?.email;

    const role = (payload as any)?.role ?? (payload as any)?.user?.role;

    return { id, email, role };
  }
}
