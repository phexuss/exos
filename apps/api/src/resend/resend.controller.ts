import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { ResendService } from './resend.service';

@ApiTags('Resend')
@Controller('resend')
export class ResendController {
  constructor(private readonly resendService: ResendService) {}

  @ApiOperation({
    summary: 'Send verification email manually (testing endpoint)',
  })
  @ApiCreatedResponse({
    description: 'Email request has been accepted by provider',
  })
  @Post('test-email')
  async sendTestEmail(@Body() body: SendTestEmailDto): Promise<void> {
    await this.resendService.sendVerificationEmail(body.email, body.code);
  }
}
