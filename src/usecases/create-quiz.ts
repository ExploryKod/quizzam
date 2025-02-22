// CORRESPOND A CreateQuizDto
export class Quiz {
  title: string;
  description: string;
}

export interface IQuizRepository {
  create(quiz: Quiz): Promise<void>;
}

export class CreateQuiz {
  constructor(private readonly repository:  IQuizRepository) {}
  execute(data: Quiz) {
    return this.repository.create(new Quiz);
  }
}