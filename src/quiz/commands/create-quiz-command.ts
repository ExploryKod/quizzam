import { Executable } from '../../shared/executable';
import { CreateQuizDTO } from '../dto/quiz.dto';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Inject } from '@nestjs/common';

type Request = CreateQuizDTO

type Response = string;

export class CreateQuizCommand implements Executable<Request, Response> {
  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository,
  ) {}

  async execute(data: Request): Promise<Response> {
    return this.repository.create(data);
  }
}
