import { IPingRepository, I_PING_REPOSITORY, I_PING_STATUS, IPingStatus } from './ping-repository.interface';
import { Executable } from '../shared/executable';
import { Inject } from '@nestjs/common';
import { PingResult } from './ping.entity';

type Response = PingResult;

export class GetVersionCommand implements Executable<Request, Response> {
  constructor(
    @Inject(I_PING_REPOSITORY)
    private readonly repository: IPingRepository
  ) {}

  async execute(): Promise<Response> {
     const databaseStatus = await this.repository.getDatabaseStatus();
     const databaseVersion = await this.repository.getDatabaseVersion();
     const apiStatus = databaseStatus ? "OK" : "Partial"

    return {
      status: apiStatus,
      database: { version: databaseVersion.version, status: databaseStatus.status }
    }
  }
}