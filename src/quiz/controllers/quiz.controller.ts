import {
  Body,
  Controller,
  Get, HttpException, HttpStatus,
  Param,
  Post, Req,
  Request
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import { User } from '../../users/entities/user.entity';
import { CreateQuiz } from '../commands/create-quiz';
import { QuizAPI } from '../contract';
import { GetQuizByIdQuery } from '../queries/get-quiz-by-id';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { Auth } from '../../auth/auth.decorator';
import { RequestWithUser } from '../../auth/model/request-with-user';

import { basicQuizDTO } from '../dto/quiz.dto';
import { GetUserQuizzes } from '../commands/get-user-quizzes';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly getUserQuizzesQuery: GetUserQuizzes,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}


  @Get()
  @Auth()
  async getUserQuizzes(@Req() request: RequestWithUser) : Promise<any> {
    const token = request.headers.authorization.split('Bearer ')[1];
    //const token = extractTokenAuthorization(request.headers.authorization)
    console.log("token", token);
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token);
    const baseUrl = request.protocol + '://' + request.get('host');
    const createUrl = `${baseUrl}/api/quiz`;

    if (!decodedToken.user_id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    try {

      const quizzes: basicQuizDTO[] | [] = await this.getUserQuizzesQuery.execute({userId : decodedToken.user_id});

      if (!quizzes) {
        return { data: [],
          _links: { create: `${baseUrl}/api/quiz`}
        };
      }

      return {
        data: quizzes,
        _links: {
          create: createUrl,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz:', error);
      throw new HttpException(
        'Erreur lors de la récupération des quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // @Post()
  // async handleCreateQuiz(
  //   @Body(new ZodValidationPipe(QuizAPI.CreateQuiz.schema))
  //   body: QuizAPI.CreateQuiz.Request,
  //   @Request() request: { user: User },
  // ): Promise<QuizAPI.CreateQuiz.Response> {
  //   return this.createQuiz.execute({
  //     user: request.user,
  //     title: body.title,
  //     description: body.description,
  //     userId: body.userId,
  //     questions: body.questions,
  //   });
  // }
  //
  // @Get('/quiz/:id')
  // async handleQuizById(
  //   @Param('id') id: string,
  // ): Promise<QuizAPI.GetQuiz.Response> {
  //   return this.queryBus.execute(new GetQuizByIdQuery(id));
  // }
}
