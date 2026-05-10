import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthStatusResponseDto } from 'src/auth/dto/auth.dto';
import { ResendService } from 'src/resend/resend.service';
import { UserPublicDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly resendService: ResendService,
  ) {}

  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user profile', type: UserPublicDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @Get('me')
  async getMe(@Req() req: Request): Promise<UserPublicDto> {
    const { sub } = req.user as AuthStatusResponseDto;
    return this.userService.getMe(sub);
  }

  @ApiOperation({
    summary: 'Update current user profile (name/username/email)',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Updated user profile',
    type: UserPublicDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
  ): Promise<UserPublicDto> {
    const { sub } = req.user as AuthStatusResponseDto;
    const { user, emailChanged } = await this.userService.updateProfile(
      sub,
      dto,
    );

    if (emailChanged) {
      const code = await this.userService.setNewVerificationCode(user.id);
      await this.resendService.sendVerificationEmail(user.email, code);
    }

    return user;
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User id (UUID)' })
  @ApiOkResponse({
    description: 'User object. Can be null when user is not found.',
    type: UserPublicDto,
  })
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserPublicDto | null> {
    return this.userService.findById(id);
  }
}
