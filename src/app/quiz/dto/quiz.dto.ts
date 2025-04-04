import {
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(500)
  description: string;
}

export class PatchOperationDto {
  @IsEnum(['replace'])
  op: 'replace';

  @IsEnum(['/title'])
  path: '/title';

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  value: string;
}

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

export class UpdateQuestionDto extends CreateQuestionDto {}
