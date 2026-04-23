import { Inject, NotFoundException } from '@nestjs/common';
import { I_USER_REPOSITORY, IUserRepository } from '../ports/user-repository.interface';
import { UserRecord } from '../models';
import { Executable } from '../../shared/executable';

type Request = string;
type Response = UserRecord;

export class GetUserByIdQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(id: Request): Promise<Response> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException();
    }

    return user
  }

}
