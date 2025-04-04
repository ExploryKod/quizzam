import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Req,
  Body,
  Res,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { QuizService } from './quiz.service';
import { Auth } from '../modules/auth/auth.decorator';
import { RequestWithUser } from '../modules/auth/model/request-with-user';
import {
  CreateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  PatchOperationDto,
} from './quiz.dto';
import * as jwt from 'jsonwebtoken';


@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  private getUserIdFromToken(request: RequestWithUser): string {
    const token = request.headers.authorization.split('Bearer ')[1];
    const decodedToken = jwt.decode(token);
    return decodedToken['user_id'];
  }

  @Get()
  @Auth()
  async getUserQuizzes(@Req() request: RequestWithUser) {
    const userId = this.getUserIdFromToken(request);
    const baseUrl = `${request.protocol}://${request.get('host')}/api/quiz`;

    try {
      const { quizzes, empty } = await this.quizService.getUserQuizzes(userId);

      if (empty) {
        return {
          data: [],
          _links: {
            create: baseUrl,
          },
        };
      }

      const quizzesWithLinks = quizzes.map((quiz) => {
        const quizObject = {
          id: quiz.id,
          title: quiz.title,
        };

        if (quiz.isStartable) {
          Object.assign(quizObject, {
            _links: {
              start: `${baseUrl}/${quiz.id}/start`,
            },
          });
        }

        return quizObject;
      });

      // Retourner les données avec les liens HATEOAS
      return {
        data: quizzesWithLinks,
        _links: {
          create: baseUrl,
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
    const userId = this.getUserIdFromToken(request);

    try {
      const quizId = await this.quizService.createQuiz(createQuizDto, userId);
      const baseUrl = `${request.protocol}://${request.get('host')}/api/quiz`;
      response.header('Location', `${baseUrl}/${quizId}`);

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
    const userId = this.getUserIdFromToken(request);

    try {
      const quiz = await this.quizService.getQuizById(id, userId);
      return {
        title: quiz.title,
        description: quiz.description,
        questions:
          quiz.questions?.map((question) => ({
            id: question.id,
            title: question.title,
            answers: question.answers || [],
          })) || [],
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
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
    @Body() operations: PatchOperationDto[],
    @Req() request: RequestWithUser
  ) {
    const userId = this.getUserIdFromToken(request);

    try {
      await this.quizService.updateQuiz(id, userId, operations);
      return null;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
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
    const userId = this.getUserIdFromToken(request);

    // Validate question data
    this.validateQuestionData(questionDto);

    try {
      const questionId = await this.quizService.addQuestion(
        quizId,
        userId,
        questionDto
      );
      const baseUrl = `${request.protocol}://${request.get('host')}/api/quiz`;
      response.header(
        'Location',
        `${baseUrl}/${quizId}/questions/${questionId}`
      );
      return null;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        "Erreur lors de l'ajout de la question: "+error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Validates question data before saving
   * @param questionDto The question data to validate
   * @throws BadRequestException if validation fails
   */
  private validateQuestionData(questionDto: CreateQuestionDto): void {
    // Check if title is missing or empty
    if (!questionDto.title || questionDto.title.trim() === '') {
      throw new BadRequestException('Question title is required');
    }

    // Check if answers array exists and has at least 2 answers
    if (!questionDto.answers || !Array.isArray(questionDto.answers) || questionDto.answers.length < 2) {
      throw new BadRequestException('Question must have at least 2 answers');
    }

    // Check if exactly one answer is marked as correct
    const correctAnswersCount = questionDto.answers.filter(answer => answer.isCorrect).length;
    if (correctAnswersCount !== 1) {
      throw new BadRequestException('Question must have exactly one correct answer');
    }

    // Check if all answers have titles
    const invalidAnswers = questionDto.answers.filter(answer => !answer.title || answer.title.trim() === '');
    if (invalidAnswers.length > 0) {
      throw new BadRequestException('All answers must have a title');
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
    const userId = this.getUserIdFromToken(request);

    try {
      await this.quizService.updateQuestion(
        quizId,
        questionId,
        userId,
        updateQuestionDto
      );
      return null;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors de la mise à jour de la question',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/start')
  @Auth()
  @HttpCode(201)
  async startQuiz(
    @Param('id') quizId: string,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response
  ) {
    const userId = this.getUserIdFromToken(request);
    const baseUrl = `${request.protocol}://${request.get('host')}/api`;

    try {
      const executionId = await this.quizService.startQuiz(quizId, userId);
      response.header('Location', `${baseUrl}/execution/${executionId}`);
      return null;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors du démarrage du quiz',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
