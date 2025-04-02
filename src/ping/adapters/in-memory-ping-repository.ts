import { IPingRepository } from '../ping-repository.interface';
import { DatabaseStatus, DatabaseVersion } from '../ping.entity';

export class InMemoryPingRepository implements IPingRepository{

  async getDatabaseVersion(): Promise<DatabaseVersion> {

    return {
      version: 'in-memory database have no version',
    };
  }

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      return {
        status: "OK"
      };
    } catch (error) {
      console.error('Firebase database connection error:', error);
      return {
        status: "KO"
      };
    }
  }
}
