import { Inject } from '@nestjs/common';
import { StartQuizDTO } from '../dto/quiz.dto';
import { Executable } from '../../shared/executable';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { I_QUIZ_GATEWAY, IQuizGateway } from '../ports/quiz-gateway.interface';

type Request = StartQuizDTO;
type Response = string;

export class StartQuizQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository,
    @Inject(I_QUIZ_GATEWAY)
    private readonly quizGateway: IQuizGateway,
  ) {}

  async execute(query: Request): Promise<Response> {
    const { quizId, baseUrl, decodedToken } = query;

    // Step 1: Start the quiz in the repository and get the execution URL
    const executionUrl = await this.repository.startQuiz(quizId, decodedToken, baseUrl); // You no longer need decodedToken here

    // Step 2: Retrieve the quiz data
    const quiz = await this.repository.findById(quizId);
    const executionId = executionUrl.split('/').pop()
    console.log("execution url is >>> ", executionUrl.split('/').pop());
    if (quiz) {
      // Step 3: Notify the host via WebSocket (using executionId)
      this.quizGateway.handleHost(executionId); // Send the executionId to the Gateway

      // Step 4: Notify participants via WebSocket (status: 'waiting', participants count: 0 initially)
      this.quizGateway.notifyParticipants(executionId, 'waiting', 0);
    }

    // Step 5: Return the execution URL as the response
    return executionUrl;
  }
}
