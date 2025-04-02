import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuizExecutionService } from './quiz-execution.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly quizExecutionService: QuizExecutionService) {}

  async handleConnection(client: Socket) {
    console.log(`[Connection] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Disconnect] Client disconnected: ${client.id}`);
    this.quizExecutionService.handleClientDisconnect(client.id);
  }

  @SubscribeMessage('host')
  async handleHost(client: Socket, payload: { executionId: string }) {
    try {
      const quizData = await this.quizExecutionService.handleHostConnection(
        client,
        payload.executionId
      );
      client.join(payload.executionId);

      // Envoyer les détails du quiz à l'hôte uniquement
      client.emit('hostDetails', { quiz: quizData });

      // Diffuser le statut initial à tous les participants
      const participants = this.quizExecutionService.getParticipantCount(
        payload.executionId
      );
      this.server.to(payload.executionId).emit('status', {
        status: 'waiting',
        participants,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, payload: { executionId: string }) {
    try {
      const quizData = await this.quizExecutionService.handleJoinRequest(
        client,
        payload.executionId
      );
      client.join(payload.executionId);

      // Envoyer les détails de base du quiz au participant
      client.emit('joinDetails', { quizTitle: quizData.title });

      // Diffuser le statut à tous les participants
      const participants = this.quizExecutionService.getParticipantCount(
        payload.executionId
      );
      this.server.to(payload.executionId).emit('status', {
        status: 'waiting',
        participants,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
      client.disconnect();
    }
  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(client: Socket, payload: { executionId: string }) {
    try {
      const result = await this.quizExecutionService.handleNextQuestion(
        client,
        payload.executionId
      );

      // Diffuser le statut 'started' à tous les participants
      const participants = this.quizExecutionService.getParticipantCount(
        payload.executionId
      );
      this.server.to(payload.executionId).emit('status', {
        status: 'started',
        participants,
      });

      // Diffuser la nouvelle question à tous les participants
      this.server.to(payload.executionId).emit('newQuestion', {
        question: result.question,
        answers: result.answers,
        isLastQuestion: result.isLastQuestion,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
