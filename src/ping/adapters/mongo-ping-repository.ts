import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { IPingRepository } from '../ping-repository.interface';
import { VersionResult } from '../ping.entity';

export class MongoPingRepository implements IPingRepository {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  async getVersion(): Promise<VersionResult> {
    const admin = this.connection.db.admin();
    const info = await admin.serverStatus();
    const version = info.version;

    return {
      version: version,
      status : version ? "OK" : "Partial",
      details : { database: version ? `Database is running on version ${version}` : "Database KO" }
    };
  }
}
