// CORRESPOND A CreateQuizDto
export class Quiz {
  public title: string;
  public description: string;

  constructor(title: string, description: string) {
    this.title = title;
    this.description = description;
  }
}

export interface IQuizRepository {
  create(quiz: Quiz): Promise<void>;
}

export class CreateQuiz {
  constructor(private readonly repository:  IQuizRepository) {}
  execute(data: Quiz) {
    return this.repository.create(new Quiz(data.title, data.description));
  }
}