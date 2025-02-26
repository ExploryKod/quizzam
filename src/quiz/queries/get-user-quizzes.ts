import { Inject, NotFoundException } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Model } from 'mongoose';
import { MongoUser } from '../../users/adapters/mongo/mongo-user';
import { MongoQuiz } from '../adapters/mongo/mongo-quiz';
import { basicQuizDTO } from '../dto/quiz.dto';
import { Executable } from '../../shared/executable';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';

type Request = {
  userId: string;
};

type Response = basicQuizDTO[] | []

export class GetUserQuizzes implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly quizRepository: IQuizRepository,
  ) {}

  async execute(query: Request): Promise<Response> {
    const { userId } = query;
    return this.quizRepository.findAllFromUser(userId);
  }

}
