import { UpdateQuizCommand } from './update-quiz-command';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('UpdateQuizCommand', () => {
  it('should delegate update to repository', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      addQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
    };
    const command = new UpdateQuizCommand(repository);
    const payload = {
      operations: [{ op: 'replace', path: '/title', value: 'Updated quiz' }],
      id: 'quiz-123',
      decodedToken: { user_id: 'uid-1' },
    };

    await command.execute(payload);

    expect(repository.update).toHaveBeenCalledWith(
      payload.operations,
      'quiz-123',
      { user_id: 'uid-1' }
    );
  });
});
