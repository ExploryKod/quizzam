import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiHttpInternalServerError } from '../core/dto/api-http-responses';
import { GetVersionCommand } from './version-repository.command';
import { PingResponseDto } from './dto/ping-response.dto';

@ApiTags('ping')
@Controller('ping')
export class PingController {
  constructor(private readonly versionRepository: GetVersionCommand) {}

  @Get()
  @ApiOperation({
    summary: 'Ping API and database',
    description: 'Returns global API health and database connectivity status.',
  })
  @ApiOkResponse({ description: 'Ping status returned.', type: PingResponseDto })
  @ApiHttpInternalServerError('Unexpected server error during health check.')
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
