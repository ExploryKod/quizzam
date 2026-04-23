import { Inject, NotFoundException } from '@nestjs/common';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Quiz } from '../entities/quiz.entity';
import { Executable } from '../../shared/executable';
import { I_QUIZ_GATEWAY, IQuizGateway } from '../ports/quiz-gateway.interface';

type Request = string
type Response = Quiz | null

export class GetQuizByIdQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly quizRepository: IQuizRepository
  ) {}

  async execute(id : Request): Promise<Response> {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new NotFoundException();
    }

    return quiz
  }

}
