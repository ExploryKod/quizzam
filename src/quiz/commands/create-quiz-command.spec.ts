import { CreateQuizCommand } from './create-quiz-command';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('CreateQuizCommand', () => {
  it('should delegate quiz creation to repository', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn().mockResolvedValue('quiz-123'),
      update: jest.fn(),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
      findPublic: jest.fn(),
      findPublicById: jest.fn(),
    };
    const command = new CreateQuizCommand(repository);
    const payload = { title: 'Quiz', description: 'Desc', userId: 'uid-1' };

    const result = await command.execute(payload);

    expect(repository.create).toHaveBeenCalledWith(payload);
    expect(result).toBe('quiz-123');
  });
});
