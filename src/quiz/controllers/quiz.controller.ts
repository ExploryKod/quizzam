import {
  Body,
  Controller,
  Get, HttpCode, HttpException, HttpStatus, Inject, NotFoundException, Param, Patch,
  Post, Put, Req, Res
} from '@nestjs/common';

import { QuizAPI } from '../contract';
import { Auth } from '../../auth/auth.decorator';
import { RequestWithUser } from '../../auth/model/request-with-user';

import { basicQuizDTO, PatchOperation, DecodedToken, CreateQuizDTO, CreateQuestionDTO } from '../dto/quiz.dto';

import { GetUserQuizzes } from '../queries/get-user-quizzes';
import { CreateQuizCommand } from '../commands/create-quiz-command'

import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import { Response } from 'express';
import { GetQuizByIdQuery } from '../queries/get-quiz-by-id';
import { UpdateQuizCommand } from '../commands/update-quiz-command';

import { v4 as uuidv4 } from 'uuid';
import { AddQuestionCommand } from '../commands/add-question-command';
import { UpdateQuestionCommand } from '../commands/update-question-command';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly getUserQuizzesQuery: GetUserQuizzes,
    private readonly createQuizCommand: CreateQuizCommand,
    private readonly getQuizByIdQuery: GetQuizByIdQuery,
    private readonly updateQuizCommand: UpdateQuizCommand,
    private readonly addQuestionCommand: AddQuestionCommand,
    private readonly updateQuestionCommand: UpdateQuestionCommand,
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
    @Body() createQuizDto: CreateQuizDTO,
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

  @Patch(':id')
  @Auth()
  @HttpCode(204)
  async updateQuiz(
    @Param('id') id: string,
    @Body() operations: PatchOperation[],
    @Req() request: RequestWithUser
  ) {

  try {
    const decodedToken:DecodedToken = await this.generateDecodedToken(request);

    const datas = {
      operations: operations,
      id: id,
      decodedToken: decodedToken,
    }

    await this.updateQuizCommand.execute(datas)

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
    @Body() questionDto: CreateQuestionDTO,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response
  ) {
    const questionId = uuidv4();

    const decodedToken: DecodedToken = await this.generateDecodedToken(request);

    const datas = {
      quizId: quizId,
      questionId: questionId,
      question: questionDto,
      decodedToken: decodedToken,
    }

    try {

      await this.addQuestionCommand.execute(datas);
      const baseUrl = request.protocol + '://' + request.get('host');
      const locationUrl = `${baseUrl}/api/quiz/${quizId}/questions/${questionId}`;
      console.log(locationUrl);
      response.header('Location', locationUrl);

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
    @Body() updateQuestionDto: CreateQuestionDTO,
    @Req() request: RequestWithUser
  ) {

    const decodedToken: DecodedToken = await this.generateDecodedToken(request);

    const datas = {
      quizId: quizId,
      questionId: questionId,
      question: updateQuestionDto,
      decodedToken: decodedToken,
    }

    try {
      await this.updateQuestionCommand.execute(datas);
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
