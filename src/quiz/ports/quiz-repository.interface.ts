import { Quiz } from '../entities/quiz.entity';
import {
  DeleteQuizResult,
  JsonPatchReplaceOperation,
  QuizSnapshot,
  UserQuizzesList,
} from '../models';
import {
  CreateQuestionPayload,
  CreateQuizPayload,
  DecodedToken,
} from '../payloads';

export const I_QUIZ_REPOSITORY = 'I_QUIZ_REPOSITORY';

export interface IQuizRepository {

  findAllFromUser(
    userId: string,
    createUrl: string,
    baseUrl: string
  ): Promise<UserQuizzesList>;
  findById(id: string): Promise<Quiz | null>;
  findPublic(): Promise<Quiz[]>;
  findPublicById(id: string): Promise<Quiz | null>;
  deleteById(
    id: string,
    decodedToken: DecodedToken
  ): Promise<DeleteQuizResult | null>;
  create(quiz: CreateQuizPayload | Quiz): Promise<string>;
  update(
    operations: JsonPatchReplaceOperation[],
    id: string,
    decodedToken: DecodedToken
  ): Promise<void>;
  addQuestion(
    id: string,
    questionId: string,
    question: CreateQuestionPayload,
    decodedToken: DecodedToken
  ): Promise<void>;
  updateQuestion(
    quizId: string,
    questionId: string,
    question: CreateQuestionPayload,
    decodedToken: DecodedToken
  ): Promise<void>;
  startQuiz(quizId:string, decodedToken: DecodedToken, baseUrl: string): Promise<string>;
  getQuizByExecutionId(executionId: string): Promise<QuizSnapshot | null>;
}
