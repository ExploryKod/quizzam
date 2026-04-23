import { NotFoundException } from '@nestjs/common';
import { GetPublicQuizById } from './get-public-quiz-by-id';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('GetPublicQuizById', () => {
  it('should return public quiz when found', async () => {
    const expected = {
      id: 'quiz-1',
      title: 'Public quiz',
      description: '',
      questions: [],
      userId: 'uid-1',
      isPublic: true,
    };
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      findPublic: jest.fn(),
      findPublicById: jest.fn().mockResolvedValue(expected as any),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new GetPublicQuizById(repository);

    const result = await query.execute('quiz-1');

    expect(repository.findPublicById).toHaveBeenCalledWith('quiz-1');
    expect(result).toEqual(expected);
  });

  it('should throw NotFoundException when public quiz is missing', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      findPublic: jest.fn(),
      findPublicById: jest.fn().mockResolvedValue(null),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new GetPublicQuizById(repository);

    await expect(query.execute('missing-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
