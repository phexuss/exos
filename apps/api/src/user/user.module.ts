import { Module } from '@nestjs/common';
import { ResendModule } from 'src/resend/resend.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ResendModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
