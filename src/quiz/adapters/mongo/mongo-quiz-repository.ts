import { Model } from 'mongoose';
import { Quiz } from '../../entities/quiz.entity';
import { IQuizRepository } from '../../ports/quiz-repository.interface';
import { MongoQuiz } from './mongo-quiz';

export class MongoQuizRepository implements IQuizRepository {
  constructor(private readonly model: Model<MongoQuiz.SchemaClass>) {
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
      userId: record._id,
    });
  }

  async create(quiz: Quiz): Promise<void> {
    const record = new this.model({
      _id: quiz.props.id,
      title: quiz.props.title,
      description: quiz.props.description,
    });

    await record.save();
  }
}