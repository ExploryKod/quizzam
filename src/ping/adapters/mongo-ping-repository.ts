import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IPingRepository } from '../ping-repository.interface';
import { DatabaseStatus, DatabaseVersion } from '../ping.entity';

export class MongoPingRepository implements IPingRepository {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    const status = this.connection.readyState;

    return {
      status: status === 1 ? "OK" : "KO"
    };
  }

  async getDatabaseVersion(): Promise<DatabaseVersion> {
    const admin = this.connection.db.admin();
    const info = await admin.serverStatus();
    const version = info.version;

    return {
      version: version
    };
  }
}
