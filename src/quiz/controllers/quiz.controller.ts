import {
  Body,
  Controller,
  Get, HttpCode, HttpException, HttpStatus, Inject, NotFoundException, Param,
  Post, Req, Res
} from '@nestjs/common';

import { QuizAPI } from '../contract';
import { Auth } from '../../auth/auth.decorator';
import { RequestWithUser } from '../../auth/model/request-with-user';

import { basicQuizDTO } from '../dto/quiz.dto';

import { GetUserQuizzes } from '../queries/get-user-quizzes';
import { CreateQuizCommand } from '../commands/create-quiz-command'

import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import { Response } from 'express';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { GetQuizByIdQuery } from '../queries/get-quiz-by-id';

type DecodedToken = {
  user_id: string;
}

class CreateQuizDto {
  title: string;
  description: string;
}

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly getUserQuizzesQuery: GetUserQuizzes,
    private readonly createQuizCommand: CreateQuizCommand,
    private readonly getQuizByIdQuery: GetQuizByIdQuery,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  private async generateDecodedToken(request:  RequestWithUser) {
    const token = request.headers.authorization.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token);

    if (!decodedToken.user_id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    return decodedToken;
  }


  @Get()
  @Auth()
  async getUserQuizzes(@Req() request: RequestWithUser) : Promise<QuizAPI.GetAllQuizzesFromUser.Response> {

    const decodedToken:DecodedToken = await this.generateDecodedToken(request);

    const baseUrl = request.protocol + '://' + request.get('host');
    const createUrl = `${baseUrl}/api/quiz`;

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

  // It creates a quiz in database but will not find despite being redirected to the quiz (for that we need the GET by quiz id to work)
  @Post()
  @Auth()
  @HttpCode(201)
  async createQuiz(

    @Req() request: RequestWithUser,
    @Body() createQuizDto: CreateQuizDto,
    @Res({ passthrough: true }) response: Response

    // @Req() request: RequestWithUser,
    // @Body(new ZodValidationPipe(QuizAPI.CreateQuiz.schema))
    // body: QuizAPI.CreateQuiz.Request,
    // @Res({ passthrough: true }) response: Response
  ): Promise<QuizAPI.CreateQuiz.Response> {

    try {
      const decodedToken:DecodedToken = await this.generateDecodedToken(request);

      const quizData = {
         title :  createQuizDto.title,
         description : createQuizDto.description,
         userId: decodedToken.user_id
      }

      const quizId: string = await this.createQuizCommand.execute(quizData);

      const baseUrl = request.protocol + '://' + request.get('host');
      const locationUrl = `${baseUrl}/api/quiz/${quizId}`;
      response.header('Location', locationUrl);

      return null;
    } catch (error) {
      console.error('Erreur lors de la création du quiz:', error);
      throw new HttpException(
        'Erreur lors de la création du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // It direct to the quiz, the post request use location of a slug that use this GET request
  @Get(':id')
  @Auth()
  async getQuizById(@Param('id') id: string, @Req() request: RequestWithUser)
  {
    const token = request.headers.authorization.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token);

    if (!decodedToken.user_id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    try {
      const quizDoc = await this.getQuizByIdQuery.execute(id);

      if (quizDoc.props.userId !== decodedToken.user_id) {
        throw new NotFoundException("Quiz non trouvé : n'appartient pas à son propriétaire");
      }

      return {
        title: quizDoc.props.title,
        description: quizDoc.props.description,
        questions: [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erreur lors de la récupération du quiz:', error);
      throw new HttpException(
        'Erreur lors de la récupération du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


}
