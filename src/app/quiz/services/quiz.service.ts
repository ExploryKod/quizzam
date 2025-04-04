import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  PatchOperationDto,
} from '../dto/quiz.dto';
import { IQuiz } from '../interfaces/quiz.interface';
import { QuizRepository } from '../ports/quiz.repository';
import {
  QuizNotFoundError,
  QuestionNotFoundError,
  UnauthorizedQuizAccessError,
  QuizNotStartableError,
} from '../errors/quiz-errors';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @Inject(QuizRepository) private readonly quizRepository: QuizRepository
  ) {}

  private generateExecutionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async startQuiz(quizId: string, userId: string): Promise<string> {
    try {
      this.logger.debug(
        `Démarrage du quiz ${quizId} par l'utilisateur ${userId}`
      );

      const quiz = await this.quizRepository.getQuizById(quizId, userId);

      // Vérification supplémentaire si nécessaire
      if (!quiz.questions || quiz.questions.length === 0) {
        throw new QuizNotStartableError(quizId, "Le quiz n'a pas de questions");
      }

      const executionId = this.generateExecutionId();
      await this.quizRepository.createExecution(quizId, userId, executionId);

      this.logger.debug(
        `Quiz ${quizId} démarré avec l'exécution ${executionId}`
      );
      return executionId;
    } catch (error) {
      this.logger.error(
        `Erreur lors du démarrage du quiz ${quizId}: ${error.message}`,
        error.stack
      );

      if (error instanceof QuizNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UnauthorizedQuizAccessError) {
        throw new UnauthorizedException(error.message);
      }

      if (error instanceof QuizNotStartableError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Erreur lors du démarrage du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserQuizzes(
    userId: string
  ): Promise<{ quizzes: any[]; empty: boolean }> {
    try {
      this.logger.debug(`Récupération des quiz pour l'utilisateur ${userId}`);
      return await this.quizRepository.getUserQuizzes(userId);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des quiz: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Erreur lors de la récupération des quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createQuiz(
    createQuizDto: CreateQuizDto,
    userId: string
  ): Promise<string> {
    try {
      this.logger.debug(`Création d'un quiz par l'utilisateur ${userId}`);
      return await this.quizRepository.createQuiz(createQuizDto, userId);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du quiz: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Erreur lors de la création du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getQuizById(id: string, userId: string): Promise<IQuiz> {
    try {
      this.logger.debug(
        `Récupération du quiz ${id} pour l'utilisateur ${userId}`
      );
      return await this.quizRepository.getQuizById(id, userId);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du quiz ${id}: ${error.message}`,
        error.stack
      );

      if (error instanceof QuizNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UnauthorizedQuizAccessError) {
        throw new UnauthorizedException(error.message);
      }

      throw new HttpException(
        'Erreur lors de la récupération du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateQuiz(
    id: string,
    userId: string,
    operations: PatchOperationDto[]
  ): Promise<void> {
    try {
      this.logger.debug(
        `Mise à jour du quiz ${id} par l'utilisateur ${userId}`
      );
      await this.quizRepository.updateQuiz(id, userId, operations);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du quiz ${id}: ${error.message}`,
        error.stack
      );

      if (error instanceof QuizNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UnauthorizedQuizAccessError) {
        throw new UnauthorizedException(error.message);
      }

      throw new HttpException(
        'Erreur lors de la mise à jour du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async addQuestion(
    quizId: string,
    userId: string,
    questionDto: CreateQuestionDto
  ): Promise<string> {
    try {
      this.logger.debug(
        `Ajout d'une question au quiz ${quizId} par l'utilisateur ${userId}`
      );
      return await this.quizRepository.addQuestion(quizId, userId, questionDto);
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'ajout d'une question au quiz ${quizId}: ${error.message}`,
        error.stack
      );

      if (error instanceof QuizNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UnauthorizedQuizAccessError) {
        throw new UnauthorizedException(error.message);
      }

      throw new HttpException(
        "Erreur lors de l'ajout de la question",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    userId: string,
    updateQuestionDto: UpdateQuestionDto
  ): Promise<void> {
    try {
      this.logger.debug(
        `Mise à jour de la question ${questionId} du quiz ${quizId} par l'utilisateur ${userId}`
      );
      await this.quizRepository.updateQuestion(
        quizId,
        questionId,
        userId,
        updateQuestionDto
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de la question ${questionId} du quiz ${quizId}: ${error.message}`,
        error.stack
      );

      if (error instanceof QuizNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof QuestionNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UnauthorizedQuizAccessError) {
        throw new UnauthorizedException(error.message);
      }

      throw new HttpException(
        'Erreur lors de la mise à jour de la question',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
