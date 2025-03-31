import { Executable } from '../../shared/executable';
import { CreateUserDto } from '../dto/user.dto'
import { IUserRepository, I_USER_REPOSITORY } from '../ports/user-repository.interface';
import { Inject } from '@nestjs/common';

type Request = {
  uid: string;
  username: string;
};

type Response = void;

export class AddUsername implements Executable<Request, Response> {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(data: Request) {
    const user = new CreateUserDto();
    user.uid = data.uid;
    user.username = data.username;
    await this.repository.addUsername(user);
  }
}
