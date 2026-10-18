import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionCacheService } from 'src/auth/session-cache.service';
import { PrismaService } from 'src/prisma/prisma.service';

type JwtPayload = {
  sub: string;
  username: string;
  sessionId: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly sessionCache: SessionCacheService,
  ) {
    const secretKey = configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (this.sessionCache.isValid(payload.sessionId, payload.sub)) {
      return payload;
    }

    const session = await this.prismaService.session.findUnique({
      where: { id: payload.sessionId },
      select: {
        userId: true,
        expiresAt: true,
      },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    this.sessionCache.remember(
      payload.sessionId,
      session.userId,
      session.expiresAt,
    );
    return payload;
  }
}
