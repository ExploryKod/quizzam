import { z } from 'zod';
import type { QuizSnapshot, UserQuizzesList } from './models';

export namespace QuizAPI {
  export namespace CreateQuiz {
    export const schema = z.object({
      title: z.string(),
      description: z.string(),
      userId: z.string(),
    });

    export type Request = z.infer<typeof schema>;
    export type Response = string
  }

  export namespace GetAllQuizzesFromUser {
    export const schema = z.object({
      userId: z.string(),
    });

    export type Request = z.infer<typeof schema>;
    export type Response = UserQuizzesList;
  }

  export namespace GetQuiz {
    export type Response = QuizSnapshot;
  }
}