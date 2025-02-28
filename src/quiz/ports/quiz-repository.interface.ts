import { Quiz } from '../entities/quiz.entity';
import { basicQuizDTO, CreateQuizDTO, DecodedToken, PatchOperation,  CreateQuestionDTO } from '../dto/quiz.dto';

export const I_QUIZ_REPOSITORY = 'I_QUIZ_REPOSITORY';

export interface IQuizRepository {
  findAllFromUser(userId: string): Promise<basicQuizDTO[]>;
  findById(id: string): Promise<Quiz | null>;
  create(quiz: CreateQuizDTO): Promise<string>;
  update(operations: PatchOperation[], id: string, decodedToken: DecodedToken): Promise<void>;
  addQuestion(id:string, questionId: string, question: CreateQuestionDTO, decodedToken: DecodedToken): Promise<void>;
  updateQuestion(id:string, questionId: string, question: CreateQuestionDTO, decodedToken: DecodedToken): Promise<void>;
}
