// import { Inject, NotFoundException } from '@nestjs/common';
// import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
// import { Model } from 'mongoose';
// import { MongoUser } from '../../users/adapters/mongo/mongo-user';
// import { MongoQuiz } from '../adapters/mongo/mongo-quiz';
// import { basicQuizDTO } from '../dto/quiz.dto';
// import { IQuizRepository } from '../ports/quiz-repository.interface';
//
// export class GetUserQuizzesQuery implements IQuery {
//   constructor(public readonly userId: string) {}
// }
//
// @QueryHandler(GetUserQuizzesQuery)
// export class GetUserQuizzes implements IQueryHandler {
//
//   constructor(
//     @Inject('IQuizRepository')
//     private readonly quizModel: Model<MongoQuiz.SchemaClass>,
//     private readonly userModel: Model<MongoUser.SchemaClass>,
//     private readonly quizRepository: IQuizRepository,
//   ) {}
//
//   async execute(query: GetUserQuizzesQuery): Promise<basicQuizDTO[] | []> {
//     const { userId } = query;
//     return this.quizRepository.findAllFromUser(userId);
//   }
// }
