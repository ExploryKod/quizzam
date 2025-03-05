import { Quiz } from '../entities/quiz.entity';
import {
  CreateQuizDTO,
  DecodedToken,
  PatchOperation,
  CreateQuestionDTO,
  DeletedQuizResponseDTO, getUserQuizDTO, QuizDTO
} from '../dto/quiz.dto';

export const I_QUIZ_REPOSITORY = 'I_QUIZ_REPOSITORY';

export interface IQuizRepository {
  findAllFromUser(userId: string, createUrl: string, baseUrl: string): Promise<getUserQuizDTO>;
  findById(id: string): Promise<Quiz | null>;
  deleteById(id: string, decodedToken: DecodedToken): Promise<DeletedQuizResponseDTO>;
  create(quiz: CreateQuizDTO): Promise<string>;
  update(operations: PatchOperation[], id: string, decodedToken: DecodedToken): Promise<void>;
  addQuestion(id:string, questionId: string, question: CreateQuestionDTO, decodedToken: DecodedToken): Promise<void>;
  updateQuestion(quizId:string, questionId: string, question: CreateQuestionDTO, decodedToken: DecodedToken): Promise<void>;
  startQuiz(quizId:string, decodedToken: DecodedToken, baseUrl: string): Promise<string>;
  getQuizByExecutionId(executionId: string): Promise<QuizDTO | null>;
}
