import { StartQuizQuery } from './start-quiz-query';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('StartQuizQuery', () => {
  it('should delegate start to repository and return execution url', async () => {
    const executionUrl = 'http://localhost:3000/api/execution/ABC123';
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn().mockResolvedValue(executionUrl),
      getQuizByExecutionId: jest.fn(),
      findPublic: jest.fn(),
      findPublicById: jest.fn(),
    };
    const query = new StartQuizQuery(repository);

    const result = await query.execute({
      quizId: 'quiz-123',
      decodedToken: { user_id: 'uid-1' },
      baseUrl: 'http://localhost:3000',
    });

    expect(repository.startQuiz).toHaveBeenCalledWith(
      'quiz-123',
      { user_id: 'uid-1' },
      'http://localhost:3000'
    );
    expect(result).toBe(executionUrl);
  });
});
