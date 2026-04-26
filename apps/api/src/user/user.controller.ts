import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
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
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ResendService } from 'src/resend/resend.service';
import { UserPublicDto, UserResponseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
      // Generate a new code on email change so user can re-verify the new address
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 30 * 60 * 1000);
      await this.userService.setVerificationCode(user.id, code, expires);
      await this.resendService.sendVerificationEmail(user.email, code);
    }

    return user;
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', description: 'User id (UUID)' })
  @ApiOkResponse({
    description: 'User object. Can be null when user is not found.',
    type: UserResponseDto,
  })
  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserResponseDto | null> {
    return this.userService.findById(id);
  }
}
