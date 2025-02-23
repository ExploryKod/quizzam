import { NotFoundException } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Model } from 'mongoose';
import { MongoUser } from '../../users/adapters/mongo/mongo-user';
import { MongoQuiz } from '../adapters/mongo/mongo-quiz';
import { QuizDTO } from '../dto/quiz.dto';

export class GetQuizByIdQuery implements IQuery {
  constructor(public id: string) {}
}

@QueryHandler(GetQuizByIdQuery)
export class GetQuizByIdQueryHandler implements IQueryHandler {

  constructor(
    private readonly quizModel: Model<MongoQuiz.SchemaClass>,
    private readonly userModel: Model<MongoUser.SchemaClass>,
  ) {}

  async execute({ id }: GetQuizByIdQuery): Promise<QuizDTO> {
    const quiz = await this.quizModel.findById(id);
    if (!quiz) {
      throw new NotFoundException();
    }

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questions: [],
    };
  }
}
