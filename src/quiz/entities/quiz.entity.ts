import { ApiProperty } from '@nestjs/swagger';

export class Answer {
  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  title: string;
}

export class Question {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [Answer] })
  answers: Answer[];
}

export class QuizEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [Question] })
  questions: Question[];

  @ApiProperty()
  userId: string;
}

export class Quiz extends QuizEntity {
  constructor(data: QuizEntity) {
    super();
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.questions = data.questions;
    this.userId = data.userId;
  }
}
