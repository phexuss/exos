import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SearchModule } from 'src/search/search.module';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 10000 }),
    PrismaModule,
    SearchModule,
  ],
  controllers: [SpotifyController],
  providers: [SpotifyService],
})
export class SpotifyModule {}
