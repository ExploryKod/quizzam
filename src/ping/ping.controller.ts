import { Controller, Get, Logger } from '@nestjs/common';
import { GetVersionCommand } from './version-repository.command';

@Controller('ping')
export class PingController {
  constructor(private readonly versionRepository: GetVersionCommand) {}

  @Get()
  async ping() {
    const result = await this.versionRepository.execute();
    Logger.log(
      `🚀 Ping request : \x1b[35m${result.status} \x1b[0m and 💽 database version ${result.database.version} is \x1b[35m${result.database.status}`
    );
    return {
      status : result.status ? result.status : "KO",
      details : { database:  result.database.status }}
  }
}
