import { NotFoundException } from '@nestjs/common';
import { GetQuizByExecutionIdQuery } from './get-quiz-by-executionId';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('GetQuizByExecutionIdQuery', () => {
  it('should return quiz when execution id exists', async () => {
    const quiz = {
      id: 'quiz-123',
      title: 'Quiz',
      description: 'Desc',
      questions: [],
    };
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn().mockResolvedValue(quiz),
    };
    const query = new GetQuizByExecutionIdQuery(repository);

    const result = await query.execute('ABC123');

    expect(repository.getQuizByExecutionId).toHaveBeenCalledWith('ABC123');
    expect(result).toEqual(quiz);
  });

  it('should throw NotFoundException when execution id is missing', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn().mockResolvedValue(null),
    };
    const query = new GetQuizByExecutionIdQuery(repository);

    await expect(query.execute('MISSING')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
