import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

/** Shared shape for answers in question bodies and resource JSON (OpenAPI + validation). */
export class AnswerDto {
  @ApiProperty({ example: 'Hyper Text Markup Language' })
  @IsString()
  title: string;
  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}

/** Question as returned in quiz resources and hypermedia (OpenAPI). */
export class QuestionDto {
  @ApiProperty({ example: 'q1' })
  id: string;
  @ApiProperty({ example: 'What does HTML stand for?' })
  title: string;
  @ApiProperty({ type: () => [AnswerDto] })
  answers: Array<AnswerDto>;
}
