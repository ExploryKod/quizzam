import { IQuiz, IQuestion } from '../interfaces/quiz.interface';
import {
  CreateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  PatchOperationDto,
} from '../dto/quiz.dto';

export const QuizRepository = Symbol('QuizRepository');

export interface QuizRepository {
  /**
   * Récupère tous les quiz d'un utilisateur
   */
  getUserQuizzes(userId: string): Promise<{ quizzes: any[]; empty: boolean }>;

  /**
   * Crée un nouveau quiz
   */
  createQuiz(createQuizDto: CreateQuizDto, userId: string): Promise<string>;

  /**
   * Récupère un quiz par son ID
   */
  getQuizById(id: string, userId: string): Promise<IQuiz>;

  /**
   * Met à jour un quiz
   */
  updateQuiz(
    id: string,
    userId: string,
    operations: PatchOperationDto[]
  ): Promise<void>;

  /**
   * Ajoute une question à un quiz
   */
  addQuestion(
    quizId: string,
    userId: string,
    questionDto: CreateQuestionDto
  ): Promise<string>;

  /**
   * Met à jour une question
   */
  updateQuestion(
    quizId: string,
    questionId: string,
    userId: string,
    updateQuestionDto: UpdateQuestionDto
  ): Promise<void>;

  /**
   * Crée une exécution de quiz
   */
  createExecution(
    quizId: string,
    userId: string,
    executionId: string
  ): Promise<void>;
}
