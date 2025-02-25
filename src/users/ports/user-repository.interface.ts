import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/user.dto';

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  addUsername(user: CreateUserDto): Promise<void>;
}
