import { z } from 'zod';
import { QuizDTO } from './dto/quiz.dto';

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

  export namespace GetQuiz {
    export type Response = QuizDTO;
  }
}