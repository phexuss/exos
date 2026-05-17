import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { DeezerService } from 'src/providers/deezer/deezer.service';
import { LastfmService } from 'src/providers/lastfm/lastfm.service';
import { SoundCloudService } from 'src/providers/soundcloud/soundcloud.service';

const HTTP_TIMEOUT_MS = 8000;
const HTTP_MAX_REDIRECTS = 3;

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: HTTP_TIMEOUT_MS,
      maxRedirects: HTTP_MAX_REDIRECTS,
    }),
  ],
  providers: [DeezerService, SoundCloudService, LastfmService],
  exports: [DeezerService, SoundCloudService, LastfmService],
})
export class ProvidersModule {}
