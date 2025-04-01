import { Quiz } from '../entities/quiz.entity';
import {
  CreateQuizDTO,
  DecodedToken,
  PatchOperation,
  CreateQuestionDTO,
  DeletedQuizResponseDTO, getUserQuizDTO, QuizDTO
} from '../dto/quiz.dto';
import { QuestionEvent } from '../gateways/quiz.gateway';

export const I_QUIZ_REPOSITORY = 'I_QUIZ_REPOSITORY';

export interface IQuizRepository {
  // get(id: Quizz, userId: string): Promise<Quizz>
  //save(quiz:Quiz): Promise<void>;
  // getAll(userId: string): Promise<Quizz[]>;
  // delete(quizzId: string): Promise<void>;


  findAllFromUser(userId: string, createUrl: string, baseUrl: string): Promise<getUserQuizDTO>;
  findById(id: string): Promise<Quiz | null>;
  deleteById(id: string, decodedToken: DecodedToken): Promise<DeletedQuizResponseDTO>;
  create(quiz: CreateQuizDTO | Quiz): Promise<string>;
  update(operations: PatchOperation[], id: string, decodedToken: DecodedToken): Promise<void>;
  addQuestion(id:string, questionId: string, question: CreateQuestionDTO, decodedToken: DecodedToken): Promise<void>;
  updateQuestion(quizId:string, questionId: string, question: CreateQuestionDTO, decodedToken: DecodedToken): Promise<void>;
  startQuiz(quizId:string, decodedToken: DecodedToken, baseUrl: string): Promise<string>;
  getQuizByExecutionId(executionId: string): Promise<QuizDTO | null>;
  getNextQuestion(quizId:string, questionIndex: number): Promise<QuestionEvent | null>;
}
