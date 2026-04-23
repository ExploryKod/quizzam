import { Inject, NotFoundException } from '@nestjs/common';
import { Executable } from '../../shared/executable';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Quiz } from '../entities/quiz.entity';

type Request = string;
type Response = Quiz;

export class GetPublicQuizById implements Executable<Request, Response> {
  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly quizRepository: IQuizRepository
  ) {}

  async execute(id: Request): Promise<Response> {
    const quiz = await this.quizRepository.findPublicById(id);
    if (!quiz) {
      throw new NotFoundException();
    }
    return quiz;
  }
}
