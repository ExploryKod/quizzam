import { Executable } from '../../shared/executable';
import { DecodedToken, PatchOperation } from '../dto/quiz.dto';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Inject } from '@nestjs/common';

type Request = {
  operations: PatchOperation[]
  id: string
  decodedToken: DecodedToken
}

type Response = void;

export class UpdateQuizCommand implements Executable<Request, Response> {
  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository,
  ) {}

  async execute(datas: Request): Promise<Response> {
    const { operations, id, decodedToken } = datas;
    return this.repository.update(operations, id, decodedToken);
  }
}
