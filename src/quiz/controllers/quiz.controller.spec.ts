import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';
import { GetUserQuizzes } from '../queries/get-user-quizzes';
import { CreateQuizCommand } from '../commands/create-quiz-command';
import { GetQuizByIdQuery } from '../queries/get-quiz-by-id';
import { UpdateQuizCommand } from '../commands/update-quiz-command';
import { AddQuestionCommand } from '../commands/add-question-command';
import { UpdateQuestionCommand } from '../commands/update-question-command';
import { DeleteQuizByIdQuery } from '../queries/delete-quiz-by-id';
import { StartQuizQuery } from '../queries/start-quiz-query';


describe('QuizController', () => {
  let controller: QuizController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [
        { provide: GetUserQuizzes, useValue: { execute: jest.fn() } },
        { provide: CreateQuizCommand, useValue: { execute: jest.fn() } },
        { provide: GetQuizByIdQuery, useValue: { execute: jest.fn() } },
        { provide: UpdateQuizCommand, useValue: { execute: jest.fn() } },
        { provide: AddQuestionCommand, useValue: { execute: jest.fn() } },
        { provide: UpdateQuestionCommand, useValue: { execute: jest.fn() } },
        { provide: DeleteQuizByIdQuery, useValue: { execute: jest.fn() } },
        { provide: StartQuizQuery, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<QuizController>(QuizController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
