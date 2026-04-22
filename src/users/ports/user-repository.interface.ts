import { CreateUserProfilePayload } from '../payloads';
import { UserRecord } from '../models';

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  addUsername(data: CreateUserProfilePayload): Promise<void>;
  findById(id: string): Promise<UserRecord | null>;
}
