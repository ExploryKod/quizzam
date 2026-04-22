import { Question } from '../entities/quiz.entity';

export type UserQuizListItem = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  _links?: { start: string };
};

/**
 * Owner quiz list with HATEOAS at list level and optional `start` per row when the quiz is startable.
 */
export type UserQuizzesList = {
  data: UserQuizListItem[];
  _links: { create: string };
};
