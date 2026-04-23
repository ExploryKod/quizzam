import { AddQuestionCommand } from './add-question-command';
import { IQuizRepository } from '../ports/quiz-repository.interface';

describe('AddQuestionCommand', () => {
  it('should delegate addQuestion to repository', async () => {
    const repository: jest.Mocked<IQuizRepository> = {
      findAllFromUser: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addQuestion: jest.fn().mockResolvedValue(undefined),
      updateQuestion: jest.fn(),
      startQuiz: jest.fn(),
      getQuizByExecutionId: jest.fn(),
      findPublic: jest.fn(),
      findPublicById: jest.fn(),
    };
    const command = new AddQuestionCommand(repository);
    const payload = {
      quizId: 'quiz-123',
      questionId: 'q-1',
      question: {
        title: 'Question title',
        answers: [
          { title: 'Answer A', isCorrect: true },
          { title: 'Answer B', isCorrect: false },
        ],
      },
      decodedToken: { user_id: 'uid-1' },
    };

    await command.execute(payload);

    expect(repository.addQuestion).toHaveBeenCalledWith(
      'quiz-123',
      'q-1',
      payload.question,
      { user_id: 'uid-1' }
    );
  });
});
