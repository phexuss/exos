import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [PrismaModule],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
