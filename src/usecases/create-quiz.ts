// CORRESPOND A CreateQuizDto
export class Quiz {
  title: string;
  description: string;
}

export interface IQuizRepository {
  create(quiz: Quiz): Promise<void>;
}

export class CreateQuiz {
  execute(data: Quiz) {}
}