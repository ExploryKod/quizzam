import { Inject, NotFoundException } from '@nestjs/common';
import { I_USER_REPOSITORY, IUserRepository } from '../ports/user-repository.interface';
import { FindUserDTO } from '../dto/user.dto';
import { Executable } from '../../shared/executable';

type Request = string
type Response = FindUserDTO

export class GetUserByIdQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async execute(id : Request): Promise<Response | null> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException();
    }

    return user
  }

}
