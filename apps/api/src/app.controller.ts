import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Basic API health route' })
  @ApiOkResponse({ description: 'Simple health response string', type: String })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
