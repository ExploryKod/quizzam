import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, NotFoundException } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { GetUserQuizzes } from '../queries/get-user-quizzes';
import { CreateQuizCommand } from '../commands/create-quiz-command';
import { GetQuizByIdQuery } from '../queries/get-quiz-by-id';
import { UpdateQuizCommand } from '../commands/update-quiz-command';
import { AddQuestionCommand } from '../commands/add-question-command';
import { UpdateQuestionCommand } from '../commands/update-question-command';
import { DeleteQuizByIdQuery } from '../queries/delete-quiz-by-id';
import { StartQuizQuery } from '../queries/start-quiz-query';
import { RequestWithUser } from '../../auth/model/request-with-user';
import { Response } from 'express';

jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
}));

describe('QuizController', () => {
  let controller: QuizController;
  let getUserQuizzes: jest.Mocked<GetUserQuizzes>;
  let createQuizCommand: jest.Mocked<CreateQuizCommand>;
  let getQuizByIdQuery: jest.Mocked<GetQuizByIdQuery>;
  let updateQuizCommand: jest.Mocked<UpdateQuizCommand>;
  let addQuestionCommand: jest.Mocked<AddQuestionCommand>;
  let updateQuestionCommand: jest.Mocked<UpdateQuestionCommand>;
  let deleteQuizByIdQuery: jest.Mocked<DeleteQuizByIdQuery>;
  let startQuizQuery: jest.Mocked<StartQuizQuery>;

  const buildRequest = (decodedUserId = 'uid-1') =>
    ({
      headers: { authorization: 'Bearer token' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
    } as unknown as RequestWithUser);

  const buildResponse = () =>
    ({
      header: jest.fn(),
      status: jest.fn().mockReturnThis(),
      location: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response);

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
    getUserQuizzes = module.get(GetUserQuizzes);
    createQuizCommand = module.get(CreateQuizCommand);
    getQuizByIdQuery = module.get(GetQuizByIdQuery);
    updateQuizCommand = module.get(UpdateQuizCommand);
    addQuestionCommand = module.get(AddQuestionCommand);
    updateQuestionCommand = module.get(UpdateQuestionCommand);
    deleteQuizByIdQuery = module.get(DeleteQuizByIdQuery);
    startQuizQuery = module.get(StartQuizQuery);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUserQuizzes should return user quizzes for authenticated user', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    const request = buildRequest();
    const expected = { data: [], _links: { create: 'http://localhost:3000/api/quiz' } };
    getUserQuizzes.execute.mockResolvedValue(expected);

    const result = await controller.getUserQuizzes(request);

    expect(getUserQuizzes.execute).toHaveBeenCalledWith({
      userId: 'uid-1',
      createUrl: 'http://localhost:3000/api/quiz',
      baseUrl: 'http://localhost:3000',
    });
    expect(result).toEqual(expected);
  });

  it('getUserQuizzes should throw unauthorized without user_id', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({});

    await expect(controller.getUserQuizzes(buildRequest())).rejects.toBeInstanceOf(
      HttpException
    );
  });

  it('createQuiz should create quiz and set location header', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    createQuizCommand.execute.mockResolvedValue('quiz-123');
    const response = buildResponse();

    const result = await controller.createQuiz(
      buildRequest(),
      { title: 'Quiz', description: 'Desc', userId: 'ignored' },
      response
    );

    expect(createQuizCommand.execute).toHaveBeenCalledWith({
      title: 'Quiz',
      description: 'Desc',
      userId: 'uid-1',
    });
    expect(response.header).toHaveBeenCalledWith(
      'Location',
      'http://localhost:3000/api/quiz/quiz-123'
    );
    expect(result).toBeNull();
  });

  it('createQuiz should throw on command failure', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    createQuizCommand.execute.mockRejectedValue(new Error('boom'));

    await expect(
      controller.createQuiz(
        buildRequest(),
        { title: 'Quiz', description: 'Desc', userId: 'ignored' },
        buildResponse()
      )
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('getQuizById should return quiz payload when ownership matches', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    getQuizByIdQuery.execute.mockResolvedValue({
      userId: 'uid-1',
      title: 'Quiz',
      description: 'Desc',
      questions: [],
    } as any);

    const result = await controller.getQuizById('quiz-123', buildRequest());

    expect(result).toEqual({ title: 'Quiz', description: 'Desc', questions: [] });
  });

  it('getQuizById should throw not found when ownership differs', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    getQuizByIdQuery.execute.mockResolvedValue({
      userId: 'uid-other',
      title: 'Quiz',
      description: 'Desc',
      questions: [],
    } as any);

    await expect(controller.getQuizById('quiz-123', buildRequest())).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('deleteQuizById should return deleted quiz id', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    deleteQuizByIdQuery.execute.mockResolvedValue({ id: 'quiz-123', userId: 'uid-1' });

    const result = await controller.deleteQuizById('quiz-123', buildRequest());

    expect(result).toEqual({ id: 'quiz-123' });
  });

  it('deleteQuizById should rethrow not found', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    deleteQuizByIdQuery.execute.mockRejectedValue(new NotFoundException());

    await expect(controller.deleteQuizById('quiz-123', buildRequest())).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('updateQuiz should delegate patch operations', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    updateQuizCommand.execute.mockResolvedValue(undefined);

    await controller.updateQuiz(
      'quiz-123',
      [{ op: 'replace', path: '/title', value: 'New title' }],
      buildRequest()
    );

    expect(updateQuizCommand.execute).toHaveBeenCalledWith({
      operations: [{ op: 'replace', path: '/title', value: 'New title' }],
      id: 'quiz-123',
      decodedToken: { user_id: 'uid-1' },
    });
  });

  it('updateQuiz should throw not found when command rejects with not found', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    updateQuizCommand.execute.mockRejectedValue(new NotFoundException());

    await expect(
      controller.updateQuiz(
        'quiz-123',
        [{ op: 'replace', path: '/title', value: 'New title' }],
        buildRequest()
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('addQuestion should add question and set location header', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    addQuestionCommand.execute.mockResolvedValue(undefined);
    const response = buildResponse();

    await controller.addQuestion(
      'quiz-123',
      {
        title: 'Q1',
        answers: [
          { title: 'A', isCorrect: true },
          { title: 'B', isCorrect: false },
        ],
      },
      buildRequest(),
      response
    );

    expect(addQuestionCommand.execute).toHaveBeenCalled();
    expect(response.header).toHaveBeenCalledWith(
      'Location',
      expect.stringMatching(/^http:\/\/localhost:3000\/api\/quiz\/quiz-123\/questions\/.+$/)
    );
  });

  it('addQuestion should accept draft with empty answers and normalize payload', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    addQuestionCommand.execute.mockResolvedValue(undefined);
    const response = buildResponse();

    await controller.addQuestion(
      'quiz-123',
      { title: 'Nouvelle question', answers: [] },
      buildRequest(),
      response
    );

    expect(addQuestionCommand.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        quizId: 'quiz-123',
        question: { title: 'Nouvelle question', answers: [] },
        decodedToken: { user_id: 'uid-1' },
      })
    );
  });

  it('addQuestion should throw not found when command rejects with not found', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    addQuestionCommand.execute.mockRejectedValue(new NotFoundException());

    await expect(
      controller.addQuestion(
        'quiz-123',
        {
          title: 'Q1',
          answers: [
            { title: 'A', isCorrect: true },
            { title: 'B', isCorrect: false },
          ],
        },
        buildRequest(),
        buildResponse()
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replaceQuestion should delegate update question', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    updateQuestionCommand.execute.mockResolvedValue(undefined);

    const result = await controller.replaceQuestion(
      'quiz-123',
      'q-1',
      {
        title: 'Updated Q1',
        answers: [
          { title: 'A', isCorrect: true },
          { title: 'B', isCorrect: false },
        ],
      },
      buildRequest()
    );

    expect(updateQuestionCommand.execute).toHaveBeenCalledWith({
      quizId: 'quiz-123',
      questionId: 'q-1',
      question: {
        title: 'Updated Q1',
        answers: [
          { title: 'A', isCorrect: true },
          { title: 'B', isCorrect: false },
        ],
      },
      decodedToken: { user_id: 'uid-1' },
    });
    expect(result).toBeNull();
  });

  it('replaceQuestion should throw unauthorized when token has no user_id', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({});

    await expect(
      controller.replaceQuestion(
        'quiz-123',
        'q-1',
        { title: 'Updated', answers: [] as any },
        buildRequest()
      )
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('startQuiz should start and set execution location header', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({ user_id: 'uid-1' });
    startQuizQuery.execute.mockResolvedValue('http://localhost:3000/api/execution/ABC123');
    const response = buildResponse();

    await controller.startQuiz('quiz-123', buildRequest(), response);

    expect(startQuizQuery.execute).toHaveBeenCalledWith({
      quizId: 'quiz-123',
      decodedToken: { user_id: 'uid-1' },
      baseUrl: 'http://localhost:3000',
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.location).toHaveBeenCalledWith(
      'http://localhost:3000/api/execution/ABC123'
    );
    expect(response.send).toHaveBeenCalled();
  });

  it('startQuiz should throw unauthorized when token has no user_id', async () => {
    const jwt = require('jsonwebtoken');
    jwt.decode.mockReturnValue({});

    await expect(
      controller.startQuiz('quiz-123', buildRequest(), buildResponse())
    ).rejects.toBeInstanceOf(HttpException);
  });
});
