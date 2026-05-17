import { randomInt } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateUserDto,
  CreateUserResponseDto,
  UserProfileDto,
  UserPublicDto,
} from 'src/user/dto/create-user.dto';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private toPublic(user: {
    id: string;
    name: string;
    email: string;
    username: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserPublicDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const email = normalizeIdentifier(dto.email);
    const username = normalizeIdentifier(dto.username);
    const name = dto.name.trim();

    const existingByEmail = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingByEmail) {
      throw new ConflictException('Email is already in use');
    }
    const existingByUsername = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (existingByUsername) {
      throw new ConflictException('Username is already taken');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const newUser = await this.prismaService.user.create({
      data: {
        name,
        username,
        email,
        passwordHash: hashedPassword,
      },
    });
    return {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  }

  async findById(id: string): Promise<UserProfileDto | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
      },
    });
    return user;
  }

  async findByUsername(username: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username: normalizeIdentifier(username) },
    });
    return user;
  }

  async setVerificationCode(
    id: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id },
      data: { verifyToken: await argon2.hash(code), verifyTokenExp: expiresAt },
    });
  }

  async setNewVerificationCode(id: string): Promise<string> {
    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.setVerificationCode(id, code, expiresAt);

    return code;
  }

  async getMe(id: string): Promise<UserPublicDto> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(user);
  }

  async updateProfile(
    id: string,
    dto: UpdateUserDto,
  ): Promise<{
    user: UserPublicDto;
    emailChanged: boolean;

    verificationCode: string | null;
  }> {
    const current = await this.prismaService.user.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('User not found');
    }

    const nextUsername =
      dto.username !== undefined
        ? normalizeIdentifier(dto.username)
        : undefined;
    const nextEmail =
      dto.email !== undefined ? normalizeIdentifier(dto.email) : undefined;
    const nextName = dto.name?.trim();

    if (nextUsername !== undefined && nextUsername !== current.username) {
      const taken = await this.prismaService.user.findUnique({
        where: { username: nextUsername },
      });
      if (taken && taken.id !== id) {
        throw new ConflictException('Username is already taken');
      }
    }

    const emailChanged = nextEmail !== undefined && nextEmail !== current.email;
    if (emailChanged) {
      const taken = await this.prismaService.user.findUnique({
        where: { email: nextEmail as string },
      });
      if (taken && taken.id !== id) {
        throw new ConflictException('Email is already in use');
      }
    }

    let verificationCode: string | null = null;
    let verifyTokenHash: string | null | undefined = undefined;
    let verifyTokenExp: Date | null | undefined = undefined;
    if (emailChanged) {
      verificationCode = randomInt(100000, 1000000).toString();
      verifyTokenHash = await argon2.hash(verificationCode);
      verifyTokenExp = new Date(Date.now() + 30 * 60 * 1000);
    }

    const updated = await this.prismaService.user.update({
      where: { id },
      data: {
        name: nextName ?? undefined,
        username: nextUsername ?? undefined,
        email: nextEmail ?? undefined,
        isVerified: emailChanged ? false : undefined,
        verifyToken: emailChanged ? verifyTokenHash : undefined,
        verifyTokenExp: emailChanged ? verifyTokenExp : undefined,
      },
    });

    return { user: this.toPublic(updated), emailChanged, verificationCode };
  }
}
