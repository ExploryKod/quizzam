import { Inject } from '@nestjs/common';
import { StartQuizDTO } from '../dto/quiz.dto';
import { Executable } from '../../shared/executable';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
// import { I_QUIZ_GATEWAY, IQuizGateway } from '../ports/quiz-gateway.interface';

type Request = StartQuizDTO;
type Response = string;

export class StartQuizQuery implements Executable<Request, Response> {
  private executionUrl: string;
  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository,
  ) {}

  async execute(query: Request): Promise<Response> {
    const { quizId, baseUrl, decodedToken } = query;

    // Step 1: Start the quiz in the repository and get the execution URL
    const executionUrl = await this.repository.startQuiz(quizId, decodedToken, baseUrl);
    this.executionUrl = executionUrl;
    console.log("execution id is >>> ", executionUrl.split('/').pop());
    return executionUrl;
  }

  async getQuizIdFromExecutionUrl(): Promise<string> {
    console.log(this.executionUrl);
    return this.executionUrl.split('/')[1];
  }
}
