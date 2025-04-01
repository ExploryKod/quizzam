import { QuestionEvent } from '../../gateways/quiz.gateway';
import {
  CreateQuizDTO,
  CreateQuestionDTO,
  DecodedToken,
  DeletedQuizResponseDTO, getUserQuizDTO,
  PatchOperation,
  QuizDTO
} from '../../dto/quiz.dto';
import { Question, Quiz, QuizEntity } from '../../entities/quiz.entity';
import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { IQuizRepository } from '../../ports/quiz-repository.interface';

export class InMemoryQuizRepository implements IQuizRepository {
  private quizzes: Map<string, QuizEntity> = new Map();
  private executionIds: Map<string, string> = new Map();

  constructor(initialData?: QuizEntity[]) {
    if (initialData) {
      initialData.forEach((quiz: QuizEntity) => {
        this.quizzes.set(quiz.id || '', quiz);
      });
    }
  }

  async findAllFromUser(
    userId: string,
    createUrl: string,
    baseUrl: string
  ): Promise<getUserQuizDTO> {
    const userQuizzes = Array.from(this.quizzes.values()).filter(
      (quiz) => quiz.userId === userId
    );

    return {
      data: userQuizzes.map((quiz) => ({
        id: quiz.id || '',
        title: quiz.title,
        ...(this.executionIds.has(quiz.id || '') && {
          _links: {
            start: `${baseUrl}/api/quiz/${quiz.id}/start`,
          },
        }),
      })),
      _links: {
        create: createUrl,
      },
    };
  }

  async findById(id: string): Promise<Quiz | null> {
    return this.quizzes.get(id) || null;
  }

  async deleteById(
    id: string,
    decodedToken: DecodedToken
  ): Promise<DeletedQuizResponseDTO | null> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return null;

    if (quiz.userId !== decodedToken.user_id) {
      return {
        id,
        userId: decodedToken.user_id,
      };
    }

    this.quizzes.delete(id);
    this.executionIds.delete(id);

    return {
      id,
      userId: decodedToken.user_id,
    };
  }

  async create(data: CreateQuizDTO): Promise<string> {
    // Validation des données d'entrée

    console.log(data.title);

    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestException('Le titre du quiz est requis');
    }

    // Génération d'un ID unique
    let id: string;
    do {
      id = Math.random().toString(36).substr(2, 9);
    } while (this.quizzes.has(id));

    // Création du quiz avec validation
    const quiz = new Quiz({
      id,
      userId: data.userId,
      title: data.title || '',
      description : "",
      questions: [],
    });

    // // Validation du quiz
    // if (quiz.quizHasNoQuestion() && data.questions) {
    //   throw new BadRequestException(
    //     'Le quiz doit contenir au moins une question valide'
    //   );
    // }

    // Stockage du quiz
    this.quizzes.set(id, quiz);

    return id;
  }

  async update(
    operations: PatchOperation[],
    id: string,
    decodedToken: DecodedToken
  ): Promise<void> {
    const quiz = this.quizzes.get(id);
    if (!quiz) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (quiz.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    operations.forEach((operation) => {
      if (operation.op !== 'replace') {
        throw new HttpException(
          `Opération non supportée: ${operation.op}`,
          HttpStatus.BAD_REQUEST
        );
      }

      switch (operation.path) {
        case '/title':
          quiz.title = operation.value;
          break;
        default:
          throw new HttpException(
            `Chemin non supporté: ${operation.path}`,
            HttpStatus.BAD_REQUEST
          );
      }
    });

    this.quizzes.set(id, quiz);
  }

  async addQuestion(
    id: string,
    questionId: string,
    question: CreateQuestionDTO,
    decodedToken: DecodedToken
  ): Promise<void> {
    const quiz = this.quizzes.get(id);
    if (!quiz) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (quiz.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    quiz.questions = quiz.questions || [];
    quiz.questions.push({
      id: questionId,
      ...question,
    });

    this.quizzes.set(id, quiz);
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    question: CreateQuestionDTO,
    decodedToken: DecodedToken
  ): Promise<void> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (quiz.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (!Array.isArray(quiz.questions)) {
      quiz.questions = [];
    }

    const questionIndex = quiz.questions.findIndex(
      (q) => q.id === questionId
    );
    if (questionIndex === -1) {
      throw new NotFoundException('Question non trouvée');
    }

    quiz.questions[questionIndex] = {
      id: questionId,
      ...question,
    };

    this.quizzes.set(quizId, quiz);
  }

  async startQuiz(
    quizId: string,
    decodedToken: DecodedToken,
    baseUrl: string
  ): Promise<string> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (!this.isQuizStartable(quiz.title, quiz.questions || [])) {
      throw new BadRequestException('Quiz is not ready to be started');
    }

    const executionId = Math.random().toString(36).substr(2, 9);
    this.executionIds.set(quizId, executionId);

    return `${baseUrl}/api/execution/${executionId}`;
  }

  private isQuizStartable(title: string, questions: Question[]): boolean {
    return questions.length > 0 && title.trim().length > 0;
  }

  async getQuizByExecutionId(executionId: string): Promise<QuizDTO | null> {
    for (const [quizId, quiz] of this.quizzes.entries()) {
      if (this.executionIds.get(quizId) === executionId) {
        return {
          id: quiz.id || '',
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions || [],
        };
      }
    }
    return null;
  }

  async getNextQuestion(
    quizId: string,
    questionIndex: number
  ): Promise<QuestionEvent | null> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (
      questionIndex < 0 ||
      questionIndex >= (quiz.questions?.length || 0)
    ) {
      throw new Error('Question index out of bounds');
    }

    const question = quiz.questions?.[questionIndex];
    const answerStrings = question.answers.map((answer) => answer.title);

    return {
      question: question.title,
      answers: answerStrings,
    };
  }
}