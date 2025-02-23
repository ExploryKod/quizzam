import { IIDGenerator } from '../../core/ports/id-generator.interface';
import { Executable } from '../../shared/executable';
import { User } from '../../users/entities/user.entity';
import { Quiz } from '../entities/quiz.entity';
import { IQuizRepository } from '../ports/quiz-repository.interface';
import { QuizHasNoQuestionException, QuizHasNoTitleException, QuizHasNoDescriptionException } from '../exceptions/quiz.exceptions';

type Request = {
  user: User;
  title: string;
  description: string;
  userId: string;
  questions: string[];
};

type Response = {
  id: string;
};

export class CreateQuiz implements Executable<Request, Response> {
  constructor(
    private readonly repository: IQuizRepository,
    private readonly idGenerator: IIDGenerator,
  ) {}

  async execute(data: Request) {
    const id = this.idGenerator.generate();
    const quiz = new Quiz({
      id,
      title: data.title,
      description: data.description,
      userId: data.user.props.id,
      questions: []
    });

    if (quiz.hasNoQuestion()) {
      throw new QuizHasNoQuestionException();
    }

    if (quiz.hasNoTitle()) {
      throw new QuizHasNoTitleException();
    }

    if (quiz.hasNoDescription()) {
      throw new QuizHasNoDescriptionException();
    }

    await this.repository.create(quiz);

    return { id };
  }
}
