import { Module } from '@nestjs/common';
import { SessionCacheService } from 'src/auth/session-cache.service';
import { ResendModule } from 'src/resend/resend.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ResendModule],
  controllers: [UserController],
  // SessionCacheService lives here so UserService can drop sessions on email
  // change; AuthModule imports UserModule and gets the same instance.
  providers: [UserService, SessionCacheService],
  exports: [UserService, SessionCacheService],
})
export class UserModule {}
