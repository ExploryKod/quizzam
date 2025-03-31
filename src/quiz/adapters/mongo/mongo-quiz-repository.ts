import { Model } from 'mongoose';
import { Question, Quiz } from '../../entities/quiz.entity';
import { IQuizRepository } from '../../ports/quiz-repository.interface';
import { MongoQuiz } from './mongo-quiz';
import {
  CreateQuestionDTO,
  CreateQuizDTO,
  DecodedToken,
  DeletedQuizResponseDTO, getUserQuizDTO,
  PatchOperation, QuizDTO
} from '../../dto/quiz.dto';
import { v4 as uuid } from 'uuid';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException
} from '@nestjs/common';
import { QuestionEvent } from '../../gateways/quiz.gateway';
import { isQuizStartable, randomString } from '../utils/startable-quiz';

export class MongoQuizRepository implements IQuizRepository {
  constructor(
    @Inject(getModelToken(MongoQuiz.CollectionName)) private readonly model: Model<MongoQuiz.SchemaClass>,
  )  {
  }

  async findAllFromUser(userId: string, createUrl: string, baseUrl: string): Promise<getUserQuizDTO> {
    const quizzes = await this.model.find({ userId }).exec();

    if (!quizzes || quizzes.length === 0) {
      return {
        data: [],
        _links: {
          create: createUrl,
        },
      };
    }

    // Transform data with startability check
    const transformedQuizzes = quizzes.map((quizDoc) => {
      const quizData = quizDoc.toObject(); // Convert to plain object
      const quizId = quizData._id.toString();
      const quizTitle = quizData.title;
      const questions = quizData.questions || [];

      // Check if quiz is startable
      const isStartable = isQuizStartable(quizTitle, questions);

      // Build quiz object with conditional links
      const quizObject = {
        id: quizId,
        title: quizTitle,
      };

      // Add HATEOAS links if startable
      if (isStartable) {
        Object.assign(quizObject, {
          _links: {
            start: `${baseUrl}/api/quiz/${quizId}/start`,
          },
        });
      }

      return quizObject;
    });

    // Return transformed data with HATEOAS links
    return {
      data: transformedQuizzes,
      _links: {
        create: createUrl,
      },
    };
  }

  async findById(id: string): Promise<Quiz | null> {
    const record = await this.model.findById(id);
    if (!record) {
      return null;
    }
    
    return new Quiz({
      id: record._id,
      title: record.title,
      description: record.description,
      questions: [...record.questions],
      userId: record.userId,
    });

    // Ensure questions are unique (if they are duplicated in the database)
    // const uniqueQuestions = new Map();
    // record.questions.forEach((question) => {
    //     uniqueQuestions.set(question.id, { ...question });
    // });
    //
    // return new Quiz({
    //   id: record._id,
    //   title: record.title,
    //   description: record.description,
    //   questions: [...uniqueQuestions.values()], // Ensure unique questions
    //   userId: record.userId,
    // });
  }



  async deleteById(id: string, decodedToken: DecodedToken): Promise<DeletedQuizResponseDTO> {

    const record = await this.model.findById(id);

    if(!decodedToken) return null;

    if(decodedToken.user_id !== record.userId) {
      return {
        id: id,
        userId: decodedToken.user_id,
      };
    };

    const deletedQuiz = await this.model.findByIdAndDelete(id);

    if (!deletedQuiz) {
      return null;
    }

    return {
      id: id,
      userId: decodedToken.user_id,
    };
  }

  async create(quiz: CreateQuizDTO): Promise<string> {
    const id = uuid()
    const data = {_id: id, ...quiz};

    const record = new this.model(data);
    const result = await record.save();
    return result.id
  }

  async update(operations: PatchOperation[], id: string, decodedToken: DecodedToken): Promise<void> {
    const quizDoc = await this.model.findById(id);

    if (!quizDoc) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (quizDoc.userId.toString() !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const updateMongoData = {};

    for (const operation of operations) {
      if (operation.op !== 'replace') {
        throw new HttpException(
          `Opération non supportée: ${operation.op}`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (operation.path === '/title') {
        updateMongoData['title'] = operation.value;
      } else {
        throw new HttpException(
          `Chemin non supporté: ${operation.path}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    quizDoc.set(updateMongoData);
    await quizDoc.save();
  }

  async addQuestion(quizId:string, questionId:string, question:  CreateQuestionDTO, decodedToken: DecodedToken){
    const quizDoc = await this.model.findById(quizId);

    if (!quizDoc) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (quizDoc.userId.toString() !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const newQuestion = {
      id: questionId,
      title: question.title,
      answers: question.answers || [],
    };

    quizDoc.questions.push(newQuestion);

    await quizDoc.save();
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    question: CreateQuestionDTO,
    decodedToken: DecodedToken,
  ): Promise<void> {

    const quiz = await this.model.findById(quizId).exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.userId !== decodedToken.user_id) {
      throw new ForbiddenException('You are not authorized to update this quiz');
    }

    const questionIndex = quiz.questions.findIndex((q: any) => q.id === questionId);

    if (questionIndex === -1) {
      throw new NotFoundException('Question not found');
    }

    quiz.questions[questionIndex] = {
      id: questionId,
      title: question.title,
      answers: question.answers || [],
    };

    await quiz.save();
  }

  async startQuiz(
    quizId: string,
    decodedToken: DecodedToken,
    baseUrl: string
  ): Promise<string> {
    // Find the quiz document
    const quiz = await this.model.findById(quizId).exec();

    // Check if quiz exists
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Get quiz data and questions
    const quizData = quiz.toObject();
    const quizTitle = quizData.title;
    const questions = quizData.questions || [];

    // Verify ownership
    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    // Check if quiz is startable
    if (!isQuizStartable(quizTitle, questions)) {
      throw new BadRequestException('Quiz is not ready to be started');
    }

    // Generate random execution ID
    const executionId = randomString(6);

    return `${baseUrl}/api/execution/${executionId}`;
  }

  async getQuizByExecutionId(executionId: string): Promise<QuizDTO> {
    try {

      const quiz = await this.model.findOne({ executionId }).exec();  // Using Mongoose to find the quiz by executionId

      if (!quiz) {
        throw new NotFoundException(`Quiz with executionId ${executionId} not found`);
      }

      return {
        id: quiz._id.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions
      };
    } catch (error) {
      console.error('Error fetching quiz by executionId:', error);
      throw error;
    }
  }

  async getNextQuestion(quizId: string, questionIndex: number): Promise<QuestionEvent> {
    try {

      const quiz = await this.model.findById(quizId).exec();

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
        throw new Error('Question index out of bounds');
      }

      const question = quiz.questions[questionIndex];

      const answerStrings: string[] = question.answers.map((answer) => answer.title);

      return {
        question: question.title,
        answers: answerStrings
      };
    } catch (error) {
      console.error('Error fetching next question:', error);
      throw error;
    }
  }



}