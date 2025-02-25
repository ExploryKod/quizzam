import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import { User } from '../../users/entities/user.entity';
import { CreateQuiz } from '../commands/create-quiz';
import { QuizAPI } from '../contract';
import { GetQuizByIdQuery } from '../queries/get-quiz-by-id';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';

@Controller()
export class QuizController {
  constructor(
    private readonly createQuiz: CreateQuiz,
    private readonly queryBus: QueryBus,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  @Post('/quiz')
  async handleCreateQuiz(
    @Body(new ZodValidationPipe(QuizAPI.CreateQuiz.schema))
    body: QuizAPI.CreateQuiz.Request,
    @Request() request: { user: User },
  ): Promise<QuizAPI.CreateQuiz.Response> {
    return this.createQuiz.execute({
      user: request.user,
      title: body.title,
      description: body.description,
      userId: body.userId,
      questions: body.questions,
    });
  }

  @Get('/quiz/:id')
  async handleQuizById(
    @Param('id') id: string,
  ): Promise<QuizAPI.GetQuiz.Response> {
    return this.queryBus.execute(new GetQuizByIdQuery(id));
  }
}
