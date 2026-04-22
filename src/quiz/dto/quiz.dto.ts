import { Question } from '../entities/quiz.entity';
import { ApiProperty } from '@nestjs/swagger';

export class DecodedToken {
  @ApiProperty({ example: 'bf2b6811-78fd-4ab6-b8fa-962988eb43bc' })
  user_id: string;
}

export class AnswerDTO {
  @ApiProperty({ example: 'Hyper Text Markup Language' })
  title: string;
  @ApiProperty({ example: true })
  isCorrect: boolean;
}

export class QuestionDTO {
  @ApiProperty({ example: 'q1' })
  id: string;
  @ApiProperty({ example: 'What does HTML stand for?' })
  title: string;
  @ApiProperty({ type: () => [AnswerDTO] })
  answers: Array<AnswerDTO>;
}


export class CreateQuestionDTO {
  @ApiProperty({ example: 'What does HTML stand for?' })
  title: string;
  @ApiProperty({ type: () => [AnswerDTO] })
  answers: AnswerDTO[];
}

export class UpdateQuestionDTO {
  @ApiProperty({ example: 'Updated question title' })
  title: string;
  @ApiProperty({ type: () => [AnswerDTO] })
  answers: AnswerDTO[];
}


export class QuizDTO {
  @ApiProperty({ example: 'quiz-123' })
  id: string;
  @ApiProperty({ example: 'Quick fundamentals quiz' })
  description: string;
  @ApiProperty({ type: () => [QuestionDTO] })
  questions: Array<QuestionDTO>;
  @ApiProperty({ example: 'HTML basics' })
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

export class BasicQuizDto {
  @ApiProperty({ example: 'quiz-123' })
  id: string;
  @ApiProperty({ example: 'HTML basics' })
  title: string;
  @ApiProperty({ example: 'Quick fundamentals quiz' })
  description: string;
  @ApiProperty({ type: () => [QuestionDTO] })
  questions: Array<Question>;
  @ApiProperty({ example: 'user-42' })
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
  @ApiProperty({ example: 'http://localhost:3002/api/quiz' })
  create: string;
}

export class GetUserQuizDto {
  @ApiProperty({ type: () => [QuizDTO] })
  data: Array<QuizDTO>;
  @ApiProperty({ type: () => Link })
  _links: Link;
}

export class GetQuizByIdResponseDTO {
  @ApiProperty({ example: 'HTML basics' })
  title: string;

  @ApiProperty({ example: 'Quick fundamentals quiz' })
  description: string;

  @ApiProperty({ type: () => [QuestionDTO] })
  questions: Array<QuestionDTO>;
}

export class CreateQuizDTO {
  @ApiProperty({ example: 'HTML basics' })
  title: string;

  @ApiProperty({ example: 'Quick fundamentals quiz' })
  description: string;

  @ApiProperty({ example: 'user-42' })
  userId: string;
}

export class PatchOperation {
  @ApiProperty({ example: 'replace' })
  op: string;

  @ApiProperty({ example: '/title' })
  path: string;

  @ApiProperty({ example: 'My updated quiz title' })
  value: string;
}

export class DeletedQuizResponseDTO {
  @ApiProperty({ example: 'quiz-123' })
  id: string;
}


export class StartQuizDTO {
  @ApiProperty({ example: 'quiz-123' })
  quizId: string;

  @ApiProperty({ type: DecodedToken })
  decodedToken: DecodedToken;

  @ApiProperty({ example: 'http://localhost:3002' })
  baseUrl: string;
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