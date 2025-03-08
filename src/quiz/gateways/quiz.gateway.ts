import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';
import { Answer, Question } from '../entities/quiz.entity';
import { QuizProps } from '../dto/quiz.dto';
import { GetNextQuestionQuery } from '../queries/get-next-question';
import { GetQuizByExecutionIdQuery } from '../queries/get-quiz-by-executionId';

// issue 15
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

// issue 16
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
  private currentQuestionIndex: number | undefined = 0;
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
    this.executionRooms.get(executionId).add(client.id);

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
    console.log("[player - subscribed message] execution id ", executionId);

    // Validate execution exists
    if (!this.executionRooms.has(executionId)) {
      throw new NotFoundException(`Quiz execution ${executionId} not found`);
    }

    // Join the player to the room
    client.join(executionId);
    this.executionRooms.get(executionId).add(client.id);

    // Get quiz details
    const quiz = await this.getQuizByExecutionIdQuery.execute(executionId);
    console.log("quiz in websocket player is: ", quiz);

    // Send quiz details to the player
    const joinDetails: JoinDetailsEvent = {
      quizTitle: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
    };
    client.emit('joinDetails', joinDetails);

    // Broadcast updated status
    const statusEvent: StatusEvent = {
      status: 'starting',
      participants: this.executionRooms.get(executionId).size
    };
    this.server.to(executionId).emit('status', statusEvent);

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
    let currentQuestionIndex = this.executionQuestionIndexes.get(executionId) || 0;

    if (currentQuestionIndex >= quiz.questions.length) {
      this.logger.warn(`No more questions in the quiz for execution: ${executionId}`);
      return;
    }

    console.log("nextQuestion", quiz.questions.length, currentQuestionIndex);

    const nextQuestion: QuestionEvent = await this.getNextQuestionQuery.execute({
      quizId: quiz.id,
      questionIndex: currentQuestionIndex,
    });

    if(nextQuestion) {
      currentQuestionIndex++;
      this.executionQuestionIndexes.set(executionId, currentQuestionIndex);
      newQuestionEvent = {
        question: nextQuestion.question,
        answers: nextQuestion.answers
      };
    }

    this.server.to(executionId).emit('newQuestion', newQuestionEvent);

    const statusEvent: StatusEvent = {
      status: 'started',
      participants: this.executionRooms.get(executionId).size
    };
    this.server.to(executionId).emit('status', statusEvent);

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
