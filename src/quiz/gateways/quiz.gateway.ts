import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { I_QUIZ_REPOSITORY, IQuizRepository } from '../ports/quiz-repository.interface';

export interface HostJoinPayload {
  executionId: string;
}

export interface StatusEvent {
  status: 'waiting';
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


@WebSocketGateway({ cors: { origin: 'http://localhost:4200' } })
export class QuizGateway {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(QuizGateway.name);
  private readonly quizId: string;
  private executionRooms: Map<string, Set<string>> = new Map();
  private hostClients: Map<string, string> = new Map();

  constructor(
    @Inject(I_QUIZ_REPOSITORY)
    private readonly repository: IQuizRepository
  ){}

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

    const quiz = await this.repository.getQuizByExecutionId(executionId);
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


  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(
    @MessageBody() payload: HostJoinPayload
  ) {
    const { executionId } = payload;

    console.log("[next Question event] execution id ", executionId);

    const hostClientId = this.hostClients.get(executionId);
    if (!hostClientId) {
      this.logger.warn(`No host found for execution: ${executionId}`);
      return;
    }

    this.logger.log(`Next question requested for execution: ${executionId}`);

    this.server.to(executionId).emit('nextQuestion');
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
