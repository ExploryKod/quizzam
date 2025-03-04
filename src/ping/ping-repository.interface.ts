import { DatabaseStatus, DatabaseVersion } from './ping.entity';

export const I_PING_REPOSITORY = 'I_PING_REPOSITORY';

export interface IPingRepository {
  getDatabaseVersion(): Promise<DatabaseVersion>;
  getDatabaseStatus(): Promise<DatabaseStatus>;
}

export const I_PING_STATUS = 'I_PING_STATUS';

export interface IPingStatus {
  getStatus(): Promise<string>;
}
