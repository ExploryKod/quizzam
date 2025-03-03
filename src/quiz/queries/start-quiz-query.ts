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
    private readonly gateway: IQuizGateway,
  ) {}

  async execute(query: Request): Promise<Response> {
    const { quizId, baseUrl, decodedToken } = query;

    // Step 1: Start the quiz in the repository and get the execution URL
    const executionUrl = await this.repository.startQuiz(quizId, decodedToken, baseUrl); // You no longer need decodedToken here

    // Step 2: Retrieve the quiz data
    const quiz = await this.repository.findById(quizId);
    const executionId = executionUrl.split('/').pop()
    console.log("execution url is >>> ", executionUrl.split('/').pop());

    const notifyHostData = {
      quizId: quizId,
      title: quiz.props.title,
    }

    const notifyParticipantData = {
      quizId: quizId,
      status: "waiting",
      count: 0
    }

    if (quiz) {
        this.gateway.notifyHost(notifyHostData.quizId, notifyHostData.title)
        this.gateway.notifyParticipants(notifyParticipantData.quizId, notifyParticipantData.status, notifyParticipantData.count)
    }

    // Step 5: Return the execution URL as the response
    return executionUrl;
  }
}
