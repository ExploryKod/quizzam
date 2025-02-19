import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  HttpException,
  HttpStatus,
  Res,
  HttpCode,
} from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { RequestWithUser } from '../modules/auth/model/request-with-user';
import { Auth } from '../modules/auth/auth.decorator';
import { Response } from 'express';

class CreateQuizDto {
  title: string;
  description: string;
}

@Controller('quiz')
export class QuizController {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  @Get()
  @Auth()
  async getUserQuizzes(@Req() request: RequestWithUser) {
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
      const quizzesData = await this.firebase.firestore
        .collection('quizzes')
        .where('userId', '==', decodedToken.user_id)
        .get();

      if (quizzesData.empty) {
        return { data: [] };
      }

      const quizzes = quizzesData.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
      }));

      return { data: quizzes };
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz:', error);
      throw new HttpException(
        'Erreur lors de la récupération des quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @Auth()
  @HttpCode(201)
  async createQuiz(
    @Req() request: RequestWithUser,
    @Body() createQuizDto: CreateQuizDto,
    @Res({ passthrough: true }) response: Response
  ) {
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
      const quizData = {
        title: createQuizDto.title,
        description: createQuizDto.description,
        userId: decodedToken.user_id,
        createdAt: new Date(),
      };

      const quizRef = await this.firebase.firestore
        .collection('quizzes')
        .add(quizData);

      const baseUrl = request.protocol + '://' + request.get('host');
      const locationUrl = `${baseUrl}/quiz/${quizRef.id}`;
      console.log('locationUrl', locationUrl);
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
}
