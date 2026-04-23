import { Controller, Get, HttpException, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiHttpInternalServerError, ApiHttpNotFound } from '../../core/dto/api-http-responses';
import { GetQuizByIdResponseDto } from '../dto/quiz.dto';
import { GetPublicQuizById } from '../queries/get-public-quiz-by-id';
import { GetPublicQuizzes } from '../queries/get-public-quizzes';

class PublicQuizListItemDto {
  id: string;
  title: string;
  description: string;
}

class PublicQuizListResponseDto {
  data: PublicQuizListItemDto[];
}

@ApiTags('public-quizzes')
@Controller('public/quizzes')
export class PublicQuizController {
  constructor(
    private readonly getPublicQuizzes: GetPublicQuizzes,
    private readonly getPublicQuizById: GetPublicQuizById
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List public quizzes',
    description: 'Returns quizzes where isPublic=true, without authentication.',
  })
  @ApiOkResponse({
    description: 'Public quizzes returned.',
    type: PublicQuizListResponseDto,
  })
  @ApiHttpInternalServerError('Unexpected server error while loading public quizzes.')
  async listPublicQuizzes(): Promise<PublicQuizListResponseDto> {
    try {
      const quizzes = await this.getPublicQuizzes.execute();
      return {
        data: quizzes.map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
        })),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz publics:', error);
      throw new HttpException(
        'Erreur lors de la récupération des quiz publics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one public quiz',
    description:
      'Returns full quiz details only when isPublic=true. Returns 404 otherwise.',
  })
  @ApiParam({ name: 'id', description: 'Quiz identifier', example: 'quiz-123' })
  @ApiOkResponse({
    description: 'Public quiz found.',
    type: GetQuizByIdResponseDto,
  })
  @ApiHttpNotFound('Public quiz not found.')
  @ApiHttpInternalServerError('Unexpected server error while loading public quiz.')
  async getPublicQuiz(@Param('id') id: string): Promise<GetQuizByIdResponseDto> {
    try {
      const quiz = await this.getPublicQuizById.execute(id);
      return plainToInstance(
        GetQuizByIdResponseDto,
        {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions,
          isPublic: quiz.isPublic ?? false,
        },
        { excludeExtraneousValues: true }
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erreur lors de la récupération du quiz public:', error);
      throw new HttpException(
        'Erreur lors de la récupération du quiz public',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
