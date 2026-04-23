import { Question } from '../entities/quiz.entity';

/**
 * Quiz as loaded for execution / runtime (id + content), without persistence-only fields.
 * Mirrors the former `QuizDto` usage in repositories; HTTP responses stay documented with DTOs.
 */
export type QuizSnapshot = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
};
