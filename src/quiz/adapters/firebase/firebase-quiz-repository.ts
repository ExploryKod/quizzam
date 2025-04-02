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
  QuizDTO,
  QuizProps,
  UpdateQuestionDTO,
} from '../../dto/quiz.dto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { QuestionEvent } from '../../gateways/quiz.gateway';
import { isQuizStartable, randomString } from '../utils/startable-quiz';
import { firestore } from 'firebase-admin';

interface ExecutionData {
  id?: string;
  [key: string]: any;
}

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

    const quizzes = quizzesData.docs.map((doc) => {
      const quizData = doc.data();
      const quizId = doc.id;
      const quizTitle = quizData.title;
      const questions = quizData.questions || [];

      const isStartable = isQuizStartable(quizTitle, questions);

      const quizObject = {
        id: quizId,
        title: quizTitle,
      };

      if (isStartable) {
        Object.assign(quizObject, {
          _links: {
            start: `${baseUrl}/api/quiz/${quizId}/start`,
          },
        });
      }

      return quizObject;
    });

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
      (q: Question) => q.id === questionId
    );

    if (questionIndex === -1) {
      throw new NotFoundException('Question non trouvée');
    }

    quizData.questions[questionIndex] = {
      id: questionId,
      title: updateQuestionDto.title,
      answers: updateQuestionDto.answers || [],
    };

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

    if (!isQuizStartable(quizTitle, questions)) {
      throw new BadRequestException('Quiz is not ready to be started');
    }

    const executionId = randomString(6);

    await quizRef.update({
      executionId: executionId,
    });

    return `${baseUrl}/api/execution/${executionId}`;
  }

  async getQuizByExecutionId(executionId: string): Promise<QuizDTO> {
    const quizRef = this.firebase.firestore.collection('quizzes');

    const querySnapshot = await quizRef
      .where('executionId', '==', executionId)
      .get();

    if (querySnapshot.empty) {
      throw new NotFoundException(
        `Quiz with executionId ${executionId} not found`
      );
    }

    const quizDoc = querySnapshot.docs[0];
    const quizData = quizDoc.data();

    return {
      id: quizDoc.id,
      title: quizData.title,
      description: quizData.description,
      questions: quizData.questions,
    };
  }

  async getExecutionId(executionId: string): Promise<ExecutionData> {
    const executionDoc = await this.firebase.firestore
      .collection('executions')
      .doc(executionId)
      .get();

    if (!executionDoc.exists) {
      throw new Error('Execution not found');
    }
    const data: firestore.DocumentData = executionDoc.data();
    console.log("Firebase repo - getExecutionId data: ", data)
    return {
      ...data,
      id: executionDoc.id
    } as ExecutionData;
  }

  async getNextQuestion(
    quizId: string,
    questionIndex: number
  ): Promise<QuestionEvent> {
    try {
      // Fetch the quiz document from Firestore
      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(quizId)
        .get();

      if (!quizDoc.exists) {
        throw new Error('Quiz not found');
      }

      const quizData = quizDoc.data() as QuizProps;

      if (questionIndex < 0 || questionIndex >= quizData.questions.length) {
        throw new Error('Question index out of bounds');
      }

      const question = quizData.questions[questionIndex];

      const answerStrings: string[] = [];
      question.answers.forEach((answer) => {
        answerStrings.push(answer.title);
      });
      console.log(
        '[Repository - Firebase] question and answers : ',
        question,
        answerStrings
      );
      return {
        question: question.title,
        answers: answerStrings,
      };
    } catch (error) {
      console.error('Error fetching next question:', error);
      throw error;
    }
  }
}