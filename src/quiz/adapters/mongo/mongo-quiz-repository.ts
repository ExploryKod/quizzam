import { Model } from 'mongoose';
import { Quiz } from '../../entities/quiz.entity';
import { IQuizRepository } from '../../ports/quiz-repository.interface';
import { MongoQuiz } from './mongo-quiz';
import { basicQuizDTO, CreateQuizDTO } from '../../dto/quiz.dto';
import { v4 as uuid } from 'uuid';
import { getModelToken } from '@nestjs/mongoose';
import { Inject } from '@nestjs/common';

export class MongoQuizRepository implements IQuizRepository {
  constructor(
    @Inject(getModelToken(MongoQuiz.CollectionName)) private readonly model: Model<MongoQuiz.SchemaClass>,
  )  {
  }

  async findAllFromUser(userId: string): Promise<basicQuizDTO[] | []> {

    if (!this.model) {
      console.error('Mongo model is not injected correctly!');
    }

    const quizzes = await this.model.find({ userId }).exec();

    if(!quizzes) return [];

    return quizzes.map((quiz) => ({
      id: quiz._id,
      title: quiz.title,
    }));
  }

  async findById(id: string): Promise<Quiz | null> {
    const record = await this.model.findById(id);
    if (!record) {
      return null;
    }

    return new Quiz({
      id: record._id,
      title: record.title,
      description: record.description,
      questions: [],
      userId: record.userId,
    });
  }

  async create(quiz: CreateQuizDTO): Promise<string> {
    const id = uuid()
    const data = {_id: id, ...quiz};

    const record = new this.model(data);
    const result = await record.save();
    return result.id
  }
}