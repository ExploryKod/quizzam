import { GetUserQuizzes } from './get-user-quizzes';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('GetUserQuizzes', () => {
  it('should return quizzes from repository for the given user', async () => {
    const expected = {
      data: [],
      _links: { create: 'http://localhost:3000/api/quiz' },
    };
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn().mockResolvedValue(expected),
      findById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new GetUserQuizzes(repository);

    const result = await query.execute({
      userId: 'uid-1',
      createUrl: 'http://localhost:3000/api/quiz',
      baseUrl: 'http://localhost:3000',
    });

    expect(repository.findAllFromUser).toHaveBeenCalledWith(
      'uid-1',
      'http://localhost:3000/api/quiz',
      'http://localhost:3000'
    );
    expect(result).toEqual(expected);
  });
});
