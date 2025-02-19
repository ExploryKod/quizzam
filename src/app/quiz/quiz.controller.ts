import {
  Controller,
  Get,
  Post,
  Patch,
  Req,
  Body,
  HttpException,
  HttpStatus,
  Res,
  HttpCode,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { RequestWithUser } from '../modules/auth/model/request-with-user';
import { Auth } from '../modules/auth/auth.decorator';
import { Response } from 'express';

class CreateQuizDto {
  title: string;
  description: string;
}

class PatchOperation {
  op: string;
  path: string;
  value: string;
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

  @Get(':id')
  @Auth()
  async getQuizById(@Param('id') id: string, @Req() request: RequestWithUser) {
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
      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(id)
        .get();

      if (!quizDoc.exists) {
        throw new NotFoundException('Quiz non trouvé');
      }

      const quizData = quizDoc.data();

      if (quizData.userId !== decodedToken.user_id) {
        throw new NotFoundException('Quiz non trouvé');
      }

      return {
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions || [],
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

  @Patch(':id')
  @Auth()
  @HttpCode(204)
  async updateQuiz(
    @Param('id') id: string,
    @Body() operations: PatchOperation[],
    @Req() request: RequestWithUser
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
      const quizRef = this.firebase.firestore.collection('quizzes').doc(id);
      const quizDoc = await quizRef.get();

      if (!quizDoc.exists) {
        throw new NotFoundException('Quiz non trouvé');
      }

      const quizData = quizDoc.data();

      if (quizData.userId !== decodedToken.user_id) {
        throw new NotFoundException('Quiz non trouvé');
      }

      let updateData = {};

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

      return null;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erreur lors de la mise à jour du quiz:', error);
      throw new HttpException(
        'Erreur lors de la mise à jour du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
