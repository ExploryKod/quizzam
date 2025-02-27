import { Executable } from '../../shared/executable';
import { CreateUserDto } from '../dto/user.dto'
import { IUserRepository } from '../ports/user-repository.interface';

type Request = {
  uid: string;
  username: string;
};

type Response = void;

export class AddUsername implements Executable<Request, Response> {
  constructor(
    private readonly repository: IUserRepository,
  ) {}

  async execute(data: Request) {
    const user = new CreateUserDto();
    user.uid = data.uid;
    user.username = data.username;
    await this.repository.addUsername(user);
  }
}
