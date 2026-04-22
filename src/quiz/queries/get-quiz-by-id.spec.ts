import { NotFoundException } from '@nestjs/common';
import { GetQuizByIdQuery } from './get-quiz-by-id';
import { IQuizRepository } from '../ports/quiz-repository.interface';
import { Quiz } from '../entities/quiz.entity';

describe('GetQuizByIdQuery', () => {
  it('should return quiz when found', async () => {
    const quiz = new Quiz({
      id: 'quiz-123',
      title: 'Quiz',
      description: 'Desc',
      userId: 'uid-1',
      questions: [],
    });
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn().mockResolvedValue(quiz),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new GetQuizByIdQuery(repository);

    const result = await query.execute('quiz-123');

    expect(repository.findById).toHaveBeenCalledWith('quiz-123');
    expect(result).toEqual(quiz);
  });

  it('should throw NotFoundException when quiz is missing', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const query = new GetQuizByIdQuery(repository);

    await expect(query.execute('missing-id')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
