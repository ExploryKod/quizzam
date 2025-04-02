import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Logger, NotFoundException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Question } from '../entities/quiz.entity';
import { GetNextQuestionQuery } from '../queries/get-next-question';
import { GetQuizByExecutionIdQuery } from '../queries/get-quiz-by-executionId';

export interface HostJoinPayload {
  executionId: string;
}

export interface StatusEvent {
  status: string;
  participants: number;
}

export interface HostDetailsEvent {
  quiz: {
    id?: string;
    title: string;
    description?: string;
    questions?: [];
  };
}

type AnswerEvent = string

export interface QuestionEvent {
  question: string;
  answers: Array<AnswerEvent>;
}

export interface JoinPayload {
  executionId: string;
}

export interface JoinDetailsEvent {
  id?: string;
  quizTitle: string;
  description?: string;
  questions?: Question[];
}

@WebSocketGateway({ cors: { origin: 'http://localhost:4200' } })
export class QuizGateway {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(QuizGateway.name);
  private readonly quizId: string;
  private executionRooms: Map<string, Set<string>> = new Map();
  private hostClients: Map<string, string> = new Map();
  private executionQuestionIndexes: Map<string, number> = new Map();

  constructor(
    private readonly getQuizByExecutionIdQuery : GetQuizByExecutionIdQuery,
    private readonly getNextQuestionQuery: GetNextQuestionQuery,
  ) {
  }

  @SubscribeMessage('host')
  async handleHostJoin(
    @MessageBody() payload: HostJoinPayload,
    @ConnectedSocket() client: Socket
  ) {
    const { executionId } = payload;
    console.log("[host - susbcribed messsage] execution id ", executionId);

    client.join(executionId);

    this.hostClients.set(executionId, client.id);

    if (!this.executionRooms.has(executionId)) {
      this.executionRooms.set(executionId, new Set());
    }

    const quiz = await this.getQuizByExecutionIdQuery.execute(executionId);
    console.log("quiz in websocket host is: ", quiz)

    const quizDetails: HostDetailsEvent = {
      quiz: {
        title: quiz.title,
      }
    };

    client.emit('hostDetails', quizDetails);

    const statusEvent: StatusEvent = {
      status: 'waiting',
      participants: this.executionRooms.get(executionId).size
    };
    this.server.to(executionId).emit('status', statusEvent);

    this.logger.log(`Host joined execution: ${executionId}`);
  }

  @SubscribeMessage('join')
  async handlePlayerJoin(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() client: Socket
  ) {
    const { executionId } = payload;
    console.log("[participant - subscribed message] execution id ", executionId);

    if (!this.executionRooms.has(executionId)) {
      throw new NotFoundException(`Quiz execution ${executionId} not found`);
    }

    client.join(executionId);
    this.executionRooms.get(executionId).add(client.id);

    const quiz = await this.getQuizByExecutionIdQuery.execute(executionId);
    console.log("quiz in websocket participant is: ", quiz);

    const joinDetails: JoinDetailsEvent = {
      quizTitle: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
    };
    client.emit('joinDetails', joinDetails);

    const statusEvent: StatusEvent = {
      status: 'starting',
      participants: this.executionRooms.get(executionId).size
    };
    this.server.to(executionId).emit('status', statusEvent);

    // const firstQuestion: QuestionEvent = await this.getNextQuestionQuery.execute({
    //   quizId: quiz.id,
    //   questionIndex: 0,
    // });
    //
    // if (firstQuestion) {
    //   console.log("gateway - firstQuestion", firstQuestion);
    //   const newQuestionEvent: QuestionEvent = {
    //     question: firstQuestion.question,
    //     answers: firstQuestion.answers
    //   };
    //   console.log("event newQuestion", newQuestionEvent);
    //   client.emit('newQuestion', newQuestionEvent);
    // }

    this.logger.log(`Player joined execution: ${executionId}`);
  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(
    @MessageBody() payload: HostJoinPayload,
    @ConnectedSocket() client: Socket
  ) {
    const { executionId } = payload;

    const quiz = await this.getQuizByExecutionIdQuery.execute(executionId);

    const hostClientId = this.hostClients.get(executionId);
    if (client.id !== hostClientId) {
      this.logger.warn(`Unauthorized client tried to move to next question for execution: ${executionId}`);
      return;
    }

    let newQuestionEvent: QuestionEvent;
    let currentQuestionIndex = 0;

    if (currentQuestionIndex >= quiz.questions.length) {
      this.logger.warn(`No more questions in the quiz for execution: ${executionId}, current question index: ${currentQuestionIndex}`);
      return;
    }

    const nextQuestion: QuestionEvent = await this.getNextQuestionQuery.execute({
      quizId: quiz.id,
      questionIndex: currentQuestionIndex,
    });

    console.log(">> nextQuestion questions length: ", quiz.questions.length);
    console.log(">> nextQuestion current index: ", currentQuestionIndex);
    console.log(">> nextQuestion question: ", nextQuestion);
    if(nextQuestion) {
      console.log("gateway - event nextQuestion", nextQuestion);
      newQuestionEvent = {
        question: nextQuestion.question,
        answers: nextQuestion.answers
      };
      const index = currentQuestionIndex + 1;
      this.executionQuestionIndexes.set(executionId, currentQuestionIndex);
    }

    const statusEvent: StatusEvent = {
      status: 'started',
      participants: this.executionRooms.get(executionId).size
    };
    this.server.to(executionId).emit('status', statusEvent);
    this.logger.log(`Trigger started for execution: ${executionId}`);

    this.server.to(executionId).emit('newQuestion', newQuestionEvent);

    this.logger.log(`Moved to next question for execution: ${executionId}`);
  }

  handleDisconnect(client: Socket) {

    this.executionRooms.forEach((clients, executionId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);

        const statusEvent: StatusEvent = {
          status: 'waiting',
          participants: clients.size
        };
        this.server.to(executionId).emit('status', statusEvent);
      }
    });
  }
}
