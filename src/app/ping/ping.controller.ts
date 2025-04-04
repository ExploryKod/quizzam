import { Controller, Get } from '@nestjs/common';
import { VersionRepositoryService } from './version-repository.service';

@Controller('ping')
export class PingController {
  constructor(private readonly versionRepository: VersionRepositoryService) {}

  @Get()
  async ping() {
    return {
      response: 'pong',
      version: await this.versionRepository.getVersion(),
    };
  }
}
