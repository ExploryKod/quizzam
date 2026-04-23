import { GetPublicQuizzes } from './get-public-quizzes';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('GetPublicQuizzes', () => {
  it('should return published quizzes from repository', async () => {
    const expected = [
      {
        id: 'quiz-1',
        title: 'Public quiz',
        description: '',
        questions: [],
        userId: 'uid-1',
        isPublic: true,
      },
    ];
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      findPublic: jest.fn().mockResolvedValue(expected as any),
      findPublicById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new GetPublicQuizzes(repository);

    const result = await query.execute();

    expect(repository.findPublic).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });
});
