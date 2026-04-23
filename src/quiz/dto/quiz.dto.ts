import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Question } from '../entities/quiz.entity';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { AnswerDto, QuestionDto } from './answer-question.schemas';
import type { CreateQuestionPayload } from '../payloads/create-question.payload';

export { AnswerDto, QuestionDto } from './answer-question.schemas';

/**
 * Request body for `POST /quiz/:id/questions`. Supports **draft** questions while editing:
 * empty title, empty `answers`, or several `isCorrect: true` are allowed at creation time.
 * Stricter rules (≥2 answers, exactly one correct, non-empty title per question) are enforced
 * when **starting** the quiz (`POST /quiz/:id/start`), not here — keeps parity with the legacy frontend flow.
 */
export class CreateQuestionDraftDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Nouvelle question',
    required: false,
    description: 'Optional while drafting; may be pre-filled by the client.',
  })
  title?: string;

  /** Draft: answers are only checked as an array; per-answer structure is enforced on quiz `start` / on full replace via `UpdateQuestionDto`. */
  @IsOptional()
  @IsArray()
  @ApiProperty({
    type: () => [AnswerDto],
    required: false,
    description: 'Optional; may be empty or incomplete until the user finishes editing.',
  })
  answers?: AnswerDto[];
}

/** Normalizes draft ingress to the shape used by `CreateQuestionCommand` and repositories. */
export function normalizeNewQuestionFromDraft(
  body: CreateQuestionDraftDto
): CreateQuestionPayload {
  return {
    title: body.title?.trim() ?? '',
    answers: Array.isArray(body.answers) ? body.answers : [],
  };
}

export class UpdateQuestionDto {
  @IsString()
  @ApiProperty({ example: 'Updated question title' })
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ApiProperty({ type: () => [AnswerDto] })
  answers: AnswerDto[];
}


export class QuizDto {
  @ApiProperty({ example: 'quiz-123' })
  id: string;
  @ApiProperty({ example: 'Quick fundamentals quiz' })
  description: string;
  @ApiProperty({ type: () => [QuestionDto] })
  questions: Array<QuestionDto>;
  @ApiProperty({ example: 'HTML basics' })
  title: string;
  @ApiProperty({ example: false, required: false })
  isPublic?: boolean;
}

export class QuizProps {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  questions: Array<Question>;
  @ApiProperty()
  userId: string;
  @ApiProperty({ default: false, required: false })
  isPublic?: boolean;
}

export class BasicQuizDto {
  @ApiProperty({ example: 'quiz-123' })
  id: string;
  @ApiProperty({ example: 'HTML basics' })
  title: string;
  @ApiProperty({ example: 'Quick fundamentals quiz' })
  description: string;
  @ApiProperty({ type: () => [QuestionDto] })
  questions: Array<Question>;
  @ApiProperty({ example: 'user-42' })
  userId: string;
  @ApiProperty({ example: false, required: false })
  isPublic?: boolean;

  constructor(id: string, title: string, description: string, questions: Array<Question>, userId: string, isPublic = false) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.questions = questions;
    this.userId = userId;
    this.isPublic = isPublic;
  }
}

export class Link {
  @ApiProperty({ example: 'http://localhost:3002/api/quiz' })
  create: string;
}

export class GetUserQuizDto {
  @ApiProperty({ type: () => [QuizDto] })
  data: Array<QuizDto>;
  @ApiProperty({ type: () => Link })
  _links: Link;
}

@ApiSchema({
  name: 'GetQuizByIdResponse',
  description:
    'Quiz detail for the authenticated owner. The `id` field repeats the resource identifier (same as the `:id` path parameter) so the JSON is self-contained for clients (typed models, local storage, derived keys) without copying the id from the URL.',
})
export class GetQuizByIdResponseDto {
  @Expose()
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Quiz document id (same value as `GET /api/quiz/{id}`).',
  })
  id: string;

  @Expose()
  @ApiProperty({ example: 'HTML basics', description: 'Quiz title' })
  title: string;

  @Expose()
  @ApiProperty({ example: 'Quick fundamentals quiz', description: 'Quiz description' })
  description: string;

  @Expose()
  @ApiProperty({ type: () => [QuestionDto], description: 'Ordered list of questions' })
  questions: Array<QuestionDto>;
  @Expose()
  @ApiProperty({ example: false, required: false, description: 'Publication flag for public endpoints.' })
  isPublic?: boolean;
}

/**
 * HTTP body for `POST /api/quiz` — only fields sent by the client. `userId` is taken from the JWT, not from the body.
 */
export class CreateQuizRequestBodyDto {
  @IsString()
  @ApiProperty({ example: 'HTML basics' })
  title: string;

  @IsString()
  @ApiProperty({ example: 'Quick fundamentals quiz' })
  description: string;
}

export class PatchOperation {
  @IsIn(['replace'])
  @ApiProperty({ example: 'replace' })
  op: 'replace';

  @IsString()
  @ApiProperty({ example: '/title' })
  path: string;

  @IsDefined()
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'boolean' }],
    examples: ['My updated quiz title', true],
  })
  value: unknown;
}

export class DeletedQuizResponseDto {
  @ApiProperty({ example: 'quiz-123' })
  id: string;

  @ApiProperty({
    example: 'user-42',
    required: false,
    description: 'Owner user id used internally by delete authorization flow.',
  })
  userId?: string;
}

export class NextQuestionEventDto {
  @ApiProperty({ example: 'What does HTML stand for?' })
  question: string;

  @ApiProperty({ example: 1 })
  questionNumber: number;

  @ApiProperty({ type: [String], example: ['Hyper Text Markup Language', 'Home Tool Markup Language'] })
  answers: string[];

  @ApiProperty({ example: 10 })
  totalQuestions: number;
}
