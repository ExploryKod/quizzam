import { Inject, NotFoundException } from '@nestjs/common';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Executable } from '../../shared/executable';
import { QuizDTO } from '../dto/quiz.dto';
import { QuestionEvent } from '../gateways/quiz.gateway';

type Request = { quizId: string, questionIndex: number };
type Response = QuestionEvent | null

export class GetNextQuestionQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository
  ) {}

  async execute(datas : Request): Promise<Response> {
    const { quizId, questionIndex } = datas;
    console.log("[query] data given", datas);
    const question = await this.repository.getNextQuestion(quizId, questionIndex);
    if (!question) {
      throw new NotFoundException();
    }
    console.log("[query] get next question ", question);
    return question
  }

}
