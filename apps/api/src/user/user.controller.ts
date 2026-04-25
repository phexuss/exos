import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
