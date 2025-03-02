import { CreateUserDto, FindUserDTO } from '../dto/user.dto';

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  addUsername(data: CreateUserDto): Promise<void>;
  findById(id: string): Promise<FindUserDTO  | null>;
}
