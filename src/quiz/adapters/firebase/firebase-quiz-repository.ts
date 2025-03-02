import { Question, Quiz } from '../../entities/quiz.entity';
import { IQuizRepository } from '../../ports/quiz-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import {
  CreateQuestionDTO,
  CreateQuizDTO,
  DecodedToken,
  DeletedQuizResponseDTO,
  getUserQuizDTO,
  PatchOperation,
  QuestionDTO,
  UpdateQuestionDTO,
} from '../../dto/quiz.dto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

export class FirebaseQuizRepository implements IQuizRepository {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async findAllFromUser(
    userId: string,
    createUrl: string,
    baseUrl: string
  ): Promise<getUserQuizDTO> {
    const quizzesData = await this.firebase.firestore
      .collection('quizzes')
      .where('userId', '==', userId)
      .get();

    if (quizzesData.empty) {
      return {
        data: [],
        _links: {
          create: createUrl,
        },
      };
    }

    // Transformation des données avec vérification de démarrabilité
    const quizzes = quizzesData.docs.map((doc) => {
      const quizData = doc.data();
      const quizId = doc.id;
      const quizTitle = quizData.title;
      const questions = quizData.questions || [];

      // Vérifier si le quiz est démarrable
      const isStartable = this.isQuizStartable(quizTitle, questions);

      // Construire l'objet quiz avec liens conditionnels
      const quizObject = {
        id: quizId,
        title: quizTitle,
      };

      // Ajouter les liens HATEOAS si démarrable
      if (isStartable) {
        Object.assign(quizObject, {
          _links: {
            start: `${baseUrl}/api/quiz/${quizId}/start`,
          },
        });
      }

      return quizObject;
    });

    // Retourner les données avec les liens HATEOAS
    return {
      data: quizzes,
      _links: {
        create: createUrl,
      },
    };
  }

  async findById(id: string): Promise<Quiz | null> {
    const quizDoc = await this.firebase.firestore
      .collection('quizzes')
      .doc(id)
      .get();

    if (!quizDoc.exists) {
      return null;
    }

    const quizData = quizDoc.data();

    return new Quiz({
      id: quizData._id,
      title: quizData.title,
      description: quizData.description,
      questions:
        quizData.questions?.map((question: QuestionDTO) => ({
          id: question.id,
          title: question.title,
          answers: question.answers || [],
        })) || [],
      userId: quizData.userId,
    });
  }

  async deleteById(
    id: string,
    decodedToken: DecodedToken
  ): Promise<DeletedQuizResponseDTO> {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(id);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      return null;
    }
    const quizData = quizDoc.data();

    if (quizData.userId !== decodedToken.user_id) {
      return {
        id: id,
        userId: decodedToken.user_id,
      };
    }

    await quizRef.delete();

    return {
      id: id,
      userId: decodedToken.user_id,
    };
  }

  async create(data: CreateQuizDTO): Promise<string> {
    const quizRef = await this.firebase.firestore
      .collection('quizzes')
      .add(data);

    return quizRef.id.toString();
  }

  async update(
    operations: PatchOperation[],
    id: string,
    decodedToken: DecodedToken
  ): Promise<void> {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(id);
    const quizDoc = await quizRef.get();
    const updateData = {};

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const quizData = quizDoc.data();

    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    for (const operation of operations) {
      if (operation.op !== 'replace') {
        throw new HttpException(
          `Opération non supportée: ${operation.op}`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (operation.path === '/title') {
        updateData['title'] = operation.value;
      } else {
        throw new HttpException(
          `Chemin non supporté: ${operation.path}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    await quizRef.update(updateData);
  }

  async addQuestion(
    quizId: string,
    questionId: string,
    question: CreateQuestionDTO,
    decodedToken: DecodedToken
  ) {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const quizData = quizDoc.data();

    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const questions = quizData.questions || [];

    const newQuestion = {
      id: questionId,
      title: question.title,
      answers: question.answers || [],
    };

    questions.push(newQuestion);

    await quizRef.update({ questions });
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDTO,
    decodedToken: DecodedToken
  ): Promise<void> {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const quizData = quizDoc.data();

    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (!Array.isArray(quizData.questions)) {
      quizData.questions = [];
    }

    const questionIndex = quizData.questions.findIndex(
      (q: any) => q.id === questionId
    );

    if (questionIndex === -1) {
      throw new NotFoundException('Question non trouvée');
    }

    const updatedQuestion = {
      id: questionId,
      title: updateQuestionDto.title,
      answers: updateQuestionDto.answers || [],
    };

    quizData.questions[questionIndex] = updatedQuestion;

    await quizRef.update({
      questions: quizData.questions,
    });
  }

  async startQuiz(
    quizId: string,
    decodedToken: DecodedToken,
    baseUrl: string
  ): Promise<string> {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz not found');
    }

    const quizData = quizDoc.data();
    const quizTitle = quizData.title;
    const questions = quizData.questions || [];

    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    // Vérifier si le quiz est démarrable
    if (!this.isQuizStartable(quizTitle, questions)) {
      throw new BadRequestException('Quiz is not ready to be started');
    }

    // Générer un ID aléatoire pour l'exécution
    const executionId = this.randomString(6);

    return `${baseUrl}/api/execution/${executionId}`;
  }

  /**
   * Détermine si un quiz est démarrable selon les critères spécifiés
   * @param title Titre du quiz
   * @param questions Tableau des questions du quiz
   * @returns Booléen indiquant si le quiz est démarrable
   */
  private isQuizStartable(title: string, questions: Question[]): boolean {
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

  /**
   * Vérifie si une question est valide selon les critères spécifiés
   * @param question Objet question à vérifier
   * @returns Booléen indiquant si la question est valide
   */
  private isQuestionValid(question: Question): boolean {
    // Critère 1: La question doit avoir un titre non vide
    if (!question.title || question.title.trim() === '') {
      return false;
    }

    // Critère 2: La question doit avoir au moins deux réponses
    if (!question.answers || question.answers.length < 2) {
      return false;
    }

    // Critère 3: Il doit y avoir exactement une réponse correcte
    const correctAnswersCount = question.answers.filter(
      (answer) => answer.isCorrect
    ).length;
    return correctAnswersCount === 1;
  }

  /**
   * Génère un identifiant aléatoire de 6 caractères
   */
  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }
}