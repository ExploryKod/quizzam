import { Model } from 'mongoose';
import { Quiz } from '../../entities/quiz.entity';
import { IQuizRepository } from '../../ports/quiz-repository.interface';
import { MongoQuiz } from './mongo-quiz';
import { basicQuizDTO, CreateQuestionDTO, CreateQuizDTO, DecodedToken, PatchOperation } from '../../dto/quiz.dto';
import { v4 as uuid } from 'uuid';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, HttpException, HttpStatus, Inject, NotFoundException } from '@nestjs/common';

export class MongoQuizRepository implements IQuizRepository {
  constructor(
    @Inject(getModelToken(MongoQuiz.CollectionName)) private readonly model: Model<MongoQuiz.SchemaClass>,
  )  {
  }

  async findAllFromUser(userId: string): Promise<basicQuizDTO[] | []> {

    if (!this.model) {
      console.error('Mongo model is not injected correctly!');
    }

    const quizzes = await this.model.find({ userId }).exec();

    if(!quizzes) return [];

    return quizzes.map((quiz) => ({
      id: quiz._id,
      title: quiz.title,
    }));
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
      questions: [],
      userId: record.userId,
    });
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

    const questionIndex = quiz.questions.findIndex((q) => q.id === questionId);

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

}