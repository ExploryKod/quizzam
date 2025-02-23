import { Quiz } from '../entities/quiz.entity';

export const I_QUIZ_REPOSITORY = 'I_QUIZ_REPOSITORY';

export interface IQuizRepository {
  findById(id: string): Promise<Quiz | null>;
  create(quiz: Quiz): Promise<void>;
}
