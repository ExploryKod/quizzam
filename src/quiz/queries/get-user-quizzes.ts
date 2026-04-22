import { Inject } from '@nestjs/common';
import { GetUserQuizDto } from '../dto/quiz.dto';
import { Executable } from '../../shared/executable';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Quiz } from '../entities/quiz.entity';

type Request = {
  userId: string;
  createUrl: string;
  baseUrl: string;
};

type Response = GetUserQuizDto

export class GetUserQuizzes implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly quizRepository: IQuizRepository,
  ) {}

  async execute(query: Request): Promise<Response> {
    const { userId, createUrl, baseUrl } = query;
    return this.quizRepository.findAllFromUser(userId, createUrl, baseUrl);
  }

}
