import { Controller, Get, Logger } from '@nestjs/common';
import { GetVersionCommand } from './version-repository.command';

@Controller('ping')
export class PingController {
  constructor(private readonly versionRepository: GetVersionCommand) {}

  @Get()
  async ping() {
    const version = await this.versionRepository.execute();
    Logger.log(
      `🚀 Ping request : \x1b[35m${version.status} \x1b[0m and 💽 database version ${version.version} is \x1b[35m${version.details.database}`
    );
    return {
      response: 'pong',
      version: version,
    };
  }
}
