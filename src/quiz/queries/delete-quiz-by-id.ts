import { HttpException, HttpStatus, Inject, NotFoundException } from '@nestjs/common';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Executable } from '../../shared/executable';
import { DecodedToken, DeletedQuizResponseDTO } from '../dto/quiz.dto';

type Request = {
  id: string;
  decodedToken: DecodedToken;
}
type Response = DeletedQuizResponseDTO;

export class DeleteQuizByIdQuery implements Executable<Request, Response> {

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly quizRepository: IQuizRepository,
  ) {}

  async execute(data : Request): Promise<Response> {
    const { id, decodedToken } = data;
    const deletedQuiz = await this.quizRepository.deleteById(id, decodedToken);

    if (!deletedQuiz) {
      throw new NotFoundException();
    }

    if(deletedQuiz.userId !== decodedToken.user_id) {
      throw new HttpException({
        status: HttpStatus.FORBIDDEN,
        error: 'Vous ne pouvez pas supprimer un quiz qui ne vous appartient pas',
      }, HttpStatus.FORBIDDEN, {
        cause: "Vous ne pouvez pas supprimer un quiz qui ne vous appartient pas"
      });
    }

    return deletedQuiz
  }

}
