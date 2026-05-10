import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { ResendService } from './resend.service';

@ApiTags('Resend')
@ApiBearerAuth()
@Controller('resend')
export class ResendController {
  constructor(
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({
    summary: 'Send verification email manually (testing endpoint)',
  })
  @ApiCreatedResponse({
    description: 'Email request has been accepted by provider',
  })
  @Post('test-email')
  async sendTestEmail(@Body() body: SendTestEmailDto): Promise<void> {
    if (!this.configService.get<boolean>('RESEND_TEST_ENDPOINT_ENABLED')) {
      throw new NotFoundException('Endpoint not found');
    }

    await this.resendService.sendVerificationEmail(body.email, body.code);
  }
}
