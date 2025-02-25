import { z } from 'zod';
import { QuizDTO, basicQuizDTO } from './dto/quiz.dto';

export namespace QuizAPI {
  export namespace CreateQuiz {
    export const schema = z.object({
      title: z.string(),
      description: z.string(),
      userId: z.string(),
      questions: z.array(z.string()),
    });

    export type Request = z.infer<typeof schema>;
    export type Response = {
      id: string;
    };
  }

  export namespace GetAllQuizzesFromUser {
    export const schema = z.object({
      userId: z.string(),
    });

    export type Request = z.infer<typeof schema>;
    export type Response = { data: basicQuizDTO[] | [], _links: { create: string } };
  }

  export namespace GetQuiz {
    export type Response = QuizDTO;
  }
}