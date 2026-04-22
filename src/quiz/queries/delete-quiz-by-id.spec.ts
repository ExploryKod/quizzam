import { HttpException, NotFoundException } from '@nestjs/common';
import { DeleteQuizByIdQuery } from './delete-quiz-by-id';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('DeleteQuizByIdQuery', () => {
  const decodedToken = { user_id: 'uid-1' };

  it('should throw NotFoundException when repository returns null', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(null as any),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new DeleteQuizByIdQuery(repository);

    await expect(
      query.execute({ id: 'quiz-123', decodedToken })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw forbidden when deleted quiz owner differs', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest
        .fn()
        .mockResolvedValue({ id: 'quiz-123', userId: 'uid-other' }),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new DeleteQuizByIdQuery(repository);

    await expect(
      query.execute({ id: 'quiz-123', decodedToken })
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('should return deleted quiz when ownership matches', async () => {
    const expected = { id: 'quiz-123', userId: 'uid-1' };
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn().mockResolvedValue(expected),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new DeleteQuizByIdQuery(repository);

    const result = await query.execute({ id: 'quiz-123', decodedToken });

    expect(result).toEqual(expected);
  });
});
