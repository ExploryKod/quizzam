import { Question } from '../entities/quiz.entity';
import { Entity } from '../../shared/entity';

export type DecodedToken = {
  user_id: string;
}

class AnswerDTO {
  title: string;
  isCorrect: boolean;
}

export type QuestionDTO = {
  id: string;
  title: string;
  answers: Array<AnswerDTO>;
}


export class CreateQuestionDTO {
  title: string;
  answers: AnswerDTO[];
}

export class UpdateQuestionDTO {
  title: string;
  answers: AnswerDTO[];
}


export type QuizDTO = {
  id: string;
  description: string;
  questions: Array<QuestionDTO>;
  title: string;
};

export type QuizProps = {
  id: string;
  title: string;
  description: string;
  questions: Array<Question>;
  userId: string;
};

export class basicQuizDTO {
  id: string;
  title: string;
  description: string;
  questions: Array<Question>;
  userId: string;
  constructor(id: string, title: string, description: string, questions: Array<Question>, userId: string) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.questions = questions;
    this.userId = userId;
  }
}

export type Link = {
  create: string,
}

export type getUserQuizDTO = {
  data: Array<any>,
  _links: Link
}

export type CreateQuizDTO = {
  title: string;
  description: string;
  userId: string;
}

export class PatchOperation {
  op: string;
  path: string;
  value: string;
}

export class DeletedQuizResponseDTO {
  id: string;
  userId: string;
}

export class StartQuizDTO {
  quizId: string;
  decodedToken: DecodedToken;
  baseUrl: string;
}

export class CreateExecutionDto {
  quizId: string;
  executionId: string;
  status: string;
}
