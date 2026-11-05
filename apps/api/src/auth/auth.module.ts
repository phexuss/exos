import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { ResendModule } from 'src/resend/resend.module';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRateLimitService } from './auth-rate-limit.service';

type TokenExpiry =
  | `${number}`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`;
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<TokenExpiry>('JWT_ACCESS_EXPIRES'),
        },
      }),
    }),
    UserModule,
    ResendModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRateLimitService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}
