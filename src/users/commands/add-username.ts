import { Executable } from '../../shared/executable';
import { CreateUserProfilePayload } from '../payloads';
import { IUserRepository, I_USER_REPOSITORY } from '../ports/user-repository.interface';
import { Inject } from '@nestjs/common';

type Request = CreateUserProfilePayload;

type Response = void;

export class AddUsername implements Executable<Request, Response> {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(data: Request) {
    await this.repository.addUsername(data);
  }
}
