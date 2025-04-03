import { Question } from '../entities/quiz.entity';
import { Entity } from '../../shared/entity';
import { ApiProperty } from '@nestjs/swagger';

export class DecodedToken {
  @ApiProperty()
  user_id: string;
}

export class AnswerDTO {
  @ApiProperty()
  title: string;
  @ApiProperty()
  isCorrect: boolean;
}

export class QuestionDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  answers: Array<AnswerDTO>;
}


export class CreateQuestionDTO {
  @ApiProperty()
  title: string;
  @ApiProperty()
  answers: AnswerDTO[];
}

export class UpdateQuestionDTO {
  @ApiProperty()
  title: string;
  @ApiProperty()
  answers: AnswerDTO[];
}


export class QuizDTO {
  @ApiProperty()
  id: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  questions: Array<QuestionDTO>;
  @ApiProperty()
  title: string;
};

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
};

export class basicQuizDTO {
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

  constructor(id: string, title: string, description: string, questions: Array<Question>, userId: string) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.questions = questions;
    this.userId = userId;
  }
}

export class Link {
  @ApiProperty()
  create: string;
}

export class getUserQuizDTO {
  @ApiProperty()
  data: Array<any>;
  @ApiProperty()
  _links: Link;
}

export class CreateQuizDTO {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  userId: string;
}

export class PatchOperation {
  @ApiProperty()
  op: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  value: string;
}

export class DeletedQuizResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;
}


export class StartQuizDTO {
  @ApiProperty()
  quizId: string;

  @ApiProperty({ type: DecodedToken })
  decodedToken: DecodedToken;

  @ApiProperty()
  baseUrl: string;
}

export class CreateExecutionDto {
  @ApiProperty()
  quizId: string;

  @ApiProperty()
  executionId: string;

  @ApiProperty()
  status: string;
}

export class NextQuestionEventDto {
  @ApiProperty()
  question: string;

  @ApiProperty()
  questionNumber: number;

  @ApiProperty({ type: [String] })
  answers: string[];

  @ApiProperty()
  totalQuestions: number;
}