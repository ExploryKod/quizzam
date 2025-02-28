import { IPingRepository, I_PING_REPOSITORY } from './ping-repository.interface';
import { Executable } from '../shared/executable';
import { Inject } from '@nestjs/common';

type DatabaseStatus = {
  database: string;
}

type Ping = {
  status: string;
  details: DatabaseStatus;
}

type Response = Ping;

export class GetVersionCommand implements Executable<Request, Response> {
  constructor(
    @Inject(I_PING_REPOSITORY)
    private readonly repository: IPingRepository,
  ) {}

  async execute(): Promise<Response> {
    return this.repository.getVersion();
  }
}