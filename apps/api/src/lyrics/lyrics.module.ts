import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LyricsController } from './lyrics.controller';
import { LyricsService } from './lyrics.service';

@Module({
  imports: [HttpModule.register({ timeout: 8000, maxRedirects: 3 })],
  controllers: [LyricsController],
  providers: [LyricsService],
})
export class LyricsModule {}
