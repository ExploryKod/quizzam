import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  PatchOperationDto,
} from './quiz.dto';
import { IQuiz } from './quiz.interface';

@Injectable()
export class QuizService {
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

  async startQuiz(quizId: string, userId: string): Promise<string> {
    const quiz = await this.getQuizById(quizId, userId);

    if (!this.isQuizStartable(quiz.title, quiz.questions || [])) {
      throw new BadRequestException("Le quiz n'est pas prêt à être démarré");
    }

    const executionId = this.generateExecutionId();

    await this.firebase.firestore
      .collection('executions')
      .doc(executionId)
      .set({
        quizId,
        userId,
        status: 'waiting',
        createdAt: new Date(),
      });

    return executionId;
  }

  async getUserQuizzes(
    userId: string
  ): Promise<{ quizzes: any[]; empty: boolean }> {
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
  }

  async createQuiz(
    createQuizDto: CreateQuizDto,
    userId: string
  ): Promise<string> {
    const quizRef = await this.firebase.firestore.collection('quizzes').add({
      ...createQuizDto,
      userId,
    });

    return quizRef.id;
  }

  async getQuizById(id: string, userId: string): Promise<IQuiz> {
    const quizDoc = await this.firebase.firestore
      .collection('quizzes')
      .doc(id)
      .get();

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const quizData = quizDoc.data() as IQuiz;

    if (quizData.userId !== userId) {
      throw new NotFoundException('Quiz non trouvé');
    }

    return {
      id: quizDoc.id,
      ...quizData,
    };
  }

  async updateQuiz(
    id: string,
    userId: string,
    operations: PatchOperationDto[]
  ): Promise<void> {
    const updateData = {};

    operations.forEach((operation) => {
      if (operation.path === '/title') {
        updateData['title'] = operation.value;
      }
    });

    await this.firebase.firestore
      .collection('quizzes')
      .doc(id)
      .update(updateData);
  }

  async addQuestion(
    quizId: string,
    userId: string,
    questionDto: CreateQuestionDto
  ): Promise<string> {
    const quiz = await this.getQuizById(quizId, userId);
    const questionId = uuidv4();

    const newQuestion = {
      id: questionId,
      ...questionDto,
    };

    const questions = quiz.questions || [];
    questions.push(newQuestion);

    await this.firebase.firestore
      .collection('quizzes')
      .doc(quizId)
      .update({ questions });

    return questionId;
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    userId: string,
    updateQuestionDto: UpdateQuestionDto
  ): Promise<void> {
    try {
      const quiz = await this.getQuizById(quizId, userId);

      const questions = quiz.questions || [];
      const questionIndex = questions.findIndex((q) => q.id === questionId);

      if (questionIndex === -1) {
        throw new NotFoundException('Question non trouvée');
      }

      // Conversion en objet simple
      const plainAnswers = updateQuestionDto.answers.map((answer) => ({
        title: answer.title,
        isCorrect: answer.isCorrect,
      }));

      questions[questionIndex] = {
        id: questionId,
        title: updateQuestionDto.title,
        answers: plainAnswers,
      };

      await this.firebase.firestore
        .collection('quizzes')
        .doc(quizId)
        .update({ questions });
    } catch (error) {
      console.error('Erreur détaillée:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        `Erreur lors de la mise à jour de la question: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
