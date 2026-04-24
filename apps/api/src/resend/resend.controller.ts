import { Controller } from '@nestjs/common';
import { ResendService } from './resend.service';

@Controller('resend')
export class ResendController {
  constructor(private readonly resendService: ResendService) {}
}
