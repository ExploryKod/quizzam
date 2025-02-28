import { VersionResult } from './ping.entity';

export const I_PING_REPOSITORY = 'I_PING_REPOSITORY';

export interface IPingRepository {
  getVersion(): Promise<VersionResult>;
}
