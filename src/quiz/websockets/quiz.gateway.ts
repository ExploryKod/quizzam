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

  private connectedClients: Map<string, Socket> = new Map();

  constructor(private readonly quizExecutionService: QuizExecutionService) {}

  async handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    console.log(`[Connection] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Disconnect] Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
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
      client.emit('hostDetails', { quiz: quizData });
      this.broadcastStatus(payload.executionId);
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
      client.emit('joinDetails', { quizTitle: quizData.title });
      // Envoyer le statut directement au client qui vient de rejoindre
      const participants = this.quizExecutionService.getParticipantCount(
        payload.executionId
      );
      client.emit('status', { status: 'waiting', participants });
      // Diffuser le nouveau statut à tous les membres de la salle
      this.broadcastStatus(payload.executionId);
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

      // Si c'est le premier clic (statut vient de passer à "started")
      if (result.firstClick) {
        // Mettre à jour le statut pour tous les participants
        this.broadcastStatus(payload.executionId);
        // Envoyer la confirmation à l'hôte
        client.emit('questionSent', {
          questionNumber: result.questionNumber,
          message: result.message,
        });
        return;
      }

      // Si le quiz est terminé
      if (result.completed) {
        // Notifier que le quiz est terminé
        this.server.to(payload.executionId).emit('quizCompleted');
        // Diffuser également le statut 'completed' à tous les participants
        this.broadcastStatus(payload.executionId);
        // Confirmer à l'hôte que le quiz est terminé
        client.emit('quizCompleted');
      } else {
        // Diffuser la nouvelle question à la salle
        this.server.to(payload.executionId).emit('newQuestion', result);
        // Mettre à jour le statut
        this.broadcastStatus(payload.executionId);
        // Confirmer à l'hôte que la question a été envoyée
        client.emit('questionSent', { questionNumber: result.questionNumber });
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('resetExecution')
  async handleResetExecution(client: Socket, payload: { executionId: string }) {
    try {
      await this.quizExecutionService.resetExecution(payload.executionId);
      // Notifier tous les clients de la réinitialisation
      this.server.to(payload.executionId).emit('executionReset');
      // Diffuser le statut mis à jour
      this.broadcastStatus(payload.executionId);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  private broadcastStatus(executionId: string) {
    // Récupérer le nombre de participants via le service
    const participants =
      this.quizExecutionService.getParticipantCount(executionId);
    // Récupérer le statut actuel depuis le service
    const status = this.quizExecutionService.getStatus(executionId);
    this.server.to(executionId).emit('status', { status, participants });
  }
}
