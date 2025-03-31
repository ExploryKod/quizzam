import { Inject, NotFoundException } from '@nestjs/common';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Executable } from '../../shared/executable';
import { QuizDTO } from '../dto/quiz.dto';

type Request = string
type Response = QuizDTO | null

export class GetQuizByExecutionIdQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository
  ) {}

  async execute(executionId : Request): Promise<Response> {
    const quiz = await this.repository.getQuizByExecutionId(executionId);
    if (!quiz) {
      throw new NotFoundException();
    }

    return quiz
  }

}
