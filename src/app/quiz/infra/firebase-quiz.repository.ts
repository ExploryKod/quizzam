import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { v4 as uuidv4 } from 'uuid';

import { QuizRepository } from '../ports/quiz.repository';
import { IQuiz, IQuestion } from '../interfaces/quiz.interface';
import {
  CreateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  PatchOperationDto,
} from '../dto/quiz.dto';
import { QuizMapper, QuestionMapper } from '../mappers/quiz.mapper';
import {
  QuizNotFoundError,
  QuestionNotFoundError,
  UnauthorizedQuizAccessError,
  QuizNotStartableError,
} from '../errors/quiz-errors';

@Injectable()
export class FirebaseQuizRepository implements QuizRepository {
  private readonly logger = new Logger(FirebaseQuizRepository.name);

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  private isQuizStartable(title: string, questions: any[]): boolean {
    // Critère 1: Le titre ne doit pas être vide
    if (!title || title.trim() === '') {
      return false;
    }

    // Critère 2: Il doit y avoir au moins une question
    if (!questions || questions.length === 0) {
      return false;
    }

    // Critère 3: Toutes les questions doivent être valides
    return questions.every((question) => this.isQuestionValid(question));
  }

  private isQuestionValid(question: any): boolean {
    if (!question.title || question.title.trim() === '') {
      return false;
    }

    if (!question.answers || question.answers.length < 2) {
      return false;
    }

    const correctAnswersCount = question.answers.filter(
      (answer) => answer.isCorrect
    ).length;
    if (correctAnswersCount !== 1) {
      return false;
    }

    return true;
  }

  private generateExecutionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getUserQuizzes(
    userId: string
  ): Promise<{ quizzes: any[]; empty: boolean }> {
    try {
      this.logger.debug(`Récupération des quiz pour l'utilisateur ${userId}`);

      const quizzesData = await this.firebase.firestore
        .collection('quizzes')
        .where('userId', '==', userId)
        .get();

      if (quizzesData.empty) {
        return { quizzes: [], empty: true };
      }

      const quizzes = quizzesData.docs.map((doc) => {
        const quizData = doc.data();
        const quizId = doc.id;
        const quizTitle = quizData.title;
        const questions = quizData.questions || [];

        const isStartable = this.isQuizStartable(quizTitle, questions);

        const quizObject = {
          id: quizId,
          title: quizTitle,
          isStartable,
        };

        return quizObject;
      });

      return { quizzes, empty: false };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des quiz: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async createQuiz(
    createQuizDto: CreateQuizDto,
    userId: string
  ): Promise<string> {
    try {
      this.logger.debug(`Création d'un quiz par l'utilisateur ${userId}`);

      // Utiliser le mapper pour convertir le DTO en modèle de domaine
      const quizEntity = QuizMapper.fromCreateDto(createQuizDto, userId);

      // Convertir le modèle de domaine en objet persistable
      const quizData = QuizMapper.toPersistence(quizEntity);

      // Ajouter la date de création
      quizData.createdAt = new Date();

      // Persister dans Firestore
      const quizRef = await this.firebase.firestore
        .collection('quizzes')
        .add(quizData);

      this.logger.debug(`Quiz créé avec l'ID: ${quizRef.id}`);
      return quizRef.id;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du quiz: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async getQuizById(id: string, userId: string): Promise<IQuiz> {
    try {
      this.logger.debug(
        `Récupération du quiz ${id} pour l'utilisateur ${userId}`
      );

      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(id)
        .get();

      if (!quizDoc.exists) {
        throw new QuizNotFoundError(id);
      }

      const quizData = quizDoc.data();

      if (quizData.userId !== userId) {
        throw new UnauthorizedQuizAccessError(userId, id);
      }

      // Utiliser le mapper pour convertir les données brutes en modèle de domaine
      return QuizMapper.toEntity(quizData, quizDoc.id);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du quiz ${id}: ${error.message}`,
        error.stack
      );
      throw error;
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

      // Récupérer le quiz existant
      const quiz = await this.getQuizById(id, userId);

      // Appliquer les opérations de patch
      operations.forEach((operation) => {
        if (operation.path === '/title') {
          quiz.title = operation.value;
        }
      });

      // Convertir en objet persistable
      const updateData = {
        title: quiz.title,
        updatedAt: new Date(),
      };

      // Mettre à jour dans Firestore
      await this.firebase.firestore
        .collection('quizzes')
        .doc(id)
        .update(updateData);

      this.logger.debug(`Quiz ${id} mis à jour avec succès`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du quiz ${id}: ${error.message}`,
        error.stack
      );
      throw error;
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

      // Récupérer le quiz existant
      const quiz = await this.getQuizById(quizId, userId);

      // Utiliser le mapper pour convertir le DTO en modèle de domaine
      const newQuestion = QuestionMapper.fromCreateDto(questionDto);

      // Ajouter la question au quiz
      if (!quiz.questions) {
        quiz.questions = [];
      }
      quiz.questions.push(newQuestion);

      // Mettre à jour dans Firestore avec les questions converties
      await this.firebase.firestore
        .collection('quizzes')
        .doc(quizId)
        .update({
          questions: quiz.questions.map((q) => QuestionMapper.toPersistence(q)),
          updatedAt: new Date(),
        });

      this.logger.debug(`Question ${newQuestion.id} ajoutée au quiz ${quizId}`);
      return newQuestion.id;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'ajout d'une question au quiz ${quizId}: ${error.message}`,
        error.stack
      );
      throw error;
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

      // Récupérer le quiz existant
      const quiz = await this.getQuizById(quizId, userId);

      // Vérifier que la question existe
      const questions = quiz.questions || [];
      const questionIndex = questions.findIndex((q) => q.id === questionId);

      if (questionIndex === -1) {
        throw new QuestionNotFoundError(questionId, quizId);
      }

      // Utiliser le mapper pour convertir le DTO en modèle de domaine
      const updatedQuestion = QuestionMapper.fromUpdateDto(
        updateQuestionDto,
        questionId
      );

      // Mettre à jour la question
      questions[questionIndex] = updatedQuestion;

      // Mettre à jour dans Firestore
      await this.firebase.firestore
        .collection('quizzes')
        .doc(quizId)
        .update({
          questions: questions.map((q) => QuestionMapper.toPersistence(q)),
          updatedAt: new Date(),
        });

      this.logger.debug(
        `Question ${questionId} du quiz ${quizId} mise à jour avec succès`
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de la question ${questionId} du quiz ${quizId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async createExecution(
    quizId: string,
    userId: string,
    executionId: string
  ): Promise<void> {
    try {
      this.logger.debug(
        `Création d'une exécution ${executionId} pour le quiz ${quizId} par l'utilisateur ${userId}`
      );

      await this.firebase.firestore
        .collection('executions')
        .doc(executionId)
        .set({
          quizId,
          userId,
          status: 'waiting',
          createdAt: new Date(),
        });

      this.logger.debug(`Exécution ${executionId} créée avec succès`);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de l'exécution ${executionId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
