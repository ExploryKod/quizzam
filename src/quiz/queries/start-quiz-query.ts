import { Inject } from '@nestjs/common';
import { StartQuizDTO } from '../dto/quiz.dto';
import { Executable } from '../../shared/executable';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';

type Request = StartQuizDTO
type Response = string

export class StartQuizQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository,
  ) {}

  async execute(query: Request): Promise<Response> {
    const { quizId, decodedToken, baseUrl } = query;
    return this.repository.startQuiz(quizId, decodedToken, baseUrl);
  }
}
