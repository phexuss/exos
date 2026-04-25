import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthPayloadDto } from 'src/auth/dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResendService } from 'src/resend/resend.service';
import { UserService } from 'src/user/user.service';

type TokenExpiry =
  | `${number}`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`;

type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessExpiresIn: string;
};

type RefreshTokenPayload = {
  sub: string;
  username: string;
  sessionId: string;
};

type DecodedTokenPayload = {
  exp?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly resendService: ResendService,
  ) {}

  private get accessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private get refreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  private get accessExpiresIn(): TokenExpiry {
    return this.configService.getOrThrow<TokenExpiry>('JWT_ACCESS_EXPIRES');
  }

  private get refreshExpiresIn(): TokenExpiry {
    return this.configService.getOrThrow<TokenExpiry>('JWT_REFRESH_EXPIRES');
  }

  private generateVerifyCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async validateCredentials(dto: AuthPayloadDto) {
    const { username, password } = dto;
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async issueAccessToken(
    payload: RefreshTokenPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
  }

  private async issueRefreshToken(
    payload: RefreshTokenPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  private decodeExpiryDate(token: string): Date {
    const decoded = this.jwtService.decode(token);

    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { exp } = decoded as DecodedTokenPayload;

    if (!exp) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return new Date(exp * 1000);
  }

  private buildTokenPayload(
    userId: string,
    username: string,
    sessionId: string,
  ): RefreshTokenPayload {
    return {
      sub: userId,
      username,
      sessionId,
    };
  }

  private async buildTokenPair(
    payload: RefreshTokenPayload,
  ): Promise<AuthTokenPair & { refreshExpiresAt: Date }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      accessExpiresIn: this.accessExpiresIn,
      refreshExpiresAt: this.decodeExpiryDate(refreshToken),
    };
  }

  private verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
      secret: this.refreshSecret,
    });
  }

  async login(dto: AuthPayloadDto): Promise<AuthTokenPair> {
    const user = await this.validateCredentials(dto);

    const sessionId = randomUUID();
    const payload = this.buildTokenPayload(user.id, user.username, sessionId);
    const tokenPair = await this.buildTokenPair(payload);

    await this.prismaService.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: await argon2.hash(tokenPair.refreshToken),
        expiresAt: tokenPair.refreshExpiresAt,
      },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: tokenPair.tokenType,
      accessExpiresIn: tokenPair.accessExpiresIn,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokenPair> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.prismaService.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prismaService.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidRefresh = await argon2.verify(
      session.refreshTokenHash,
      refreshToken,
    );

    if (!isValidRefresh) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const nextPayload = this.buildTokenPayload(
      payload.sub,
      payload.username,
      payload.sessionId,
    );
    const tokenPair = await this.buildTokenPair(nextPayload);

    await this.prismaService.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await argon2.hash(tokenPair.refreshToken),
        expiresAt: tokenPair.refreshExpiresAt,
      },
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: tokenPair.tokenType,
      accessExpiresIn: tokenPair.accessExpiresIn,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    await this.prismaService.session.deleteMany({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
      },
    });
  }

  async validateUser(dto: AuthPayloadDto): Promise<string> {
    const tokens = await this.login(dto);
    return tokens.accessToken;
  }

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const code = this.generateVerifyCode();
    const codeExp = new Date(Date.now() + 30 * 60 * 1000);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { verifyToken: code, verifyTokenExp: codeExp },
    });

    await this.resendService.sendVerificationEmail(email, code);
  }

  async verifyEmail(
    userId: string,
    code: string,
  ): Promise<{ success: boolean }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.verifyToken !== code) {
      throw new UnauthorizedException('Invalid code');
    }

    if (!user.verifyTokenExp || user.verifyTokenExp < new Date()) {
      throw new UnauthorizedException('Code expired');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });

    return { success: true };
  }
}
