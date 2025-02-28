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
import { RequestWithUser } from '../../auth/model/request-with-user';
import { Auth } from '../../auth/auth.decorator';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { extractTokenAuthorization } from '../../core/utils/extract-token';

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
export class OldquizController {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

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
