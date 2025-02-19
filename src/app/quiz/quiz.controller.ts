import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { v4 as uuidv4 } from 'uuid';

class CreateQuizDto {
  title: string;
  description: string;
}

class PatchOperation {
  op: string;
  path: string;
  value: string;
}

class Answer {
  title: string;
  isCorrect: boolean;
}

class CreateQuestionDto {
  title: string;
  answers: Answer[];
}

class UpdateQuestionDto {
  title: string;
  answers: Answer[];
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
    const baseUrl = request.protocol + '://' + request.get('host');
    const createUrl = `${baseUrl}/api/quiz`;

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
        return { data: [],
                _links: { create: `${baseUrl}/api/quiz`}
         };
      }

      const quizzes = quizzesData.empty
        ? []
        : quizzesData.docs.map((doc) => ({
            id: doc.id,
            title: doc.data().title,
          }));

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
        questions:
          quizData.questions?.map((question) => ({
            id: question.id,
            title: question.title,
            answers: question.answers || [],
          })) || [],
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

  @Post(':id/questions')
  @Auth()
  @HttpCode(201)
  async addQuestion(
    @Param('id') quizId: string,
    @Body() questionDto: CreateQuestionDto,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response
  ) {
    const token = request.headers.authorization.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token);
    const questionId = uuidv4();

    if (!decodedToken.user_id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    try {
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
        title: questionDto.title,
        answers: questionDto.answers || [],
      };

      questions.push(newQuestion);

      await quizRef.update({ questions });

      const baseUrl = request.protocol + '://' + request.get('host');
      const locationUrl = `${baseUrl}/api/quiz/${quizId}/questions/${questionId}`;
      console.log(locationUrl);
      response.header('Location', locationUrl);

      return null;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error("Erreur lors de l'ajout de la question:", error);
      throw new HttpException(
        "Erreur lors de l'ajout de la question",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':quizId/questions/:questionId')
  @Auth()
  @HttpCode(204)
  async replaceQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
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
        (q) => q.id === questionId
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

      return null;
    } catch (error) {
      console.error(
        'Erreur complète lors de la mise à jour de la question:',
        error
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Erreur lors de la mise à jour de la question',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
