import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { DeezerService } from 'src/providers/deezer/deezer.service';
import { LastfmService } from 'src/providers/lastfm/lastfm.service';
import { SoundCloudService } from 'src/providers/soundcloud/soundcloud.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [DeezerService, SoundCloudService, LastfmService],
  exports: [DeezerService, SoundCloudService, LastfmService],
})
export class ProvidersModule {}
