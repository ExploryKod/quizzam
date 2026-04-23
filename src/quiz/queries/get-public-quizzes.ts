import { Inject } from '@nestjs/common';
import { Executable } from '../../shared/executable';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Quiz } from '../entities/quiz.entity';

type Request = void;
type Response = Quiz[];

export class GetPublicQuizzes implements Executable<Request, Response> {
  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly quizRepository: IQuizRepository
  ) {}

  async execute(): Promise<Response> {
    return this.quizRepository.findPublic();
  }
}
