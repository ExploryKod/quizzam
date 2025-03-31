import { Executable } from '../../shared/executable';
import { CreateQuestionDTO, DecodedToken } from '../dto/quiz.dto';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Inject } from '@nestjs/common';

type Request = {
  quizId: string
  questionId: string
  question: CreateQuestionDTO
  decodedToken: DecodedToken
}

type Response = void;

export class UpdateQuestionCommand implements Executable<Request, Response> {
  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository,
  ) {}

  async execute(datas: Request): Promise<Response> {
    // const quizz: Quizz = await this.repository.getQuizz(datas.quizzId);
    // if (!quizz) throw new QuizzNotFoundException(...)
    // quizz.addQuestion(datas.question); <-- All verifications you want
    // await this.repository.save(quizz);

    const { quizId, questionId, question, decodedToken } = datas;
    return this.repository.updateQuestion(quizId, questionId, question, decodedToken);
  }
}
