import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { DeezerService } from 'src/providers/deezer/deezer.service';
import { SoundCloudService } from 'src/providers/soundcloud/soundcloud.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [DeezerService, SoundCloudService],
  exports: [DeezerService, SoundCloudService],
})
export class ProvidersModule {}
