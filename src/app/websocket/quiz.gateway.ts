import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../modules/auth/auth.guard';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';

interface HostPayload {
  executionId: string;
}

interface WebSocketMessage {
  name: string;
  data: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'quiz',
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();
  private executionHosts: Map<string, string> = new Map(); // executionId -> clientId

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);

    // Remove host mapping if this client was a host
    for (const [executionId, hostId] of this.executionHosts.entries()) {
      if (hostId === client.id) {
        this.executionHosts.delete(executionId);
        break;
      }
    }
  }

  @UseGuards(AuthGuard)
  @SubscribeMessage('host')
  async handleHost(client: Socket, payload: HostPayload) {
    const { executionId } = payload;

    try {
      // Get quiz details from Firestore
      const executionDoc = await this.firebase.firestore
        .collection('executions')
        .doc(executionId)
        .get();

      if (!executionDoc.exists) {
        throw new Error('Execution not found');
      }

      const executionData = executionDoc.data();
      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(executionData.quizId)
        .get();

      if (!quizDoc.exists) {
        throw new Error('Quiz not found');
      }

      const quizData = quizDoc.data();

      // Store this client as the host for this execution
      this.executionHosts.set(executionId, client.id);

      // Send host details only to the host
      client.emit('hostDetails', { quiz: quizData });

      // Send status to all clients in this execution room
      const connectedClients = Array.from(this.connectedClients.values());
      this.server.to(executionId).emit('status', {
        status: 'waiting',
        participants: connectedClients.length,
      });

      // Join the execution room
      client.join(executionId);
    } catch (error) {
      console.error('Error handling host event:', error);
      client.emit('error', { message: 'Failed to process host request' });
    }
  }

  // Handle pure WebSocket messages
  @UseGuards(AuthGuard)
  @SubscribeMessage('message')
  async handleMessage(client: Socket, message: WebSocketMessage) {
    if (message.name === 'host') {
      await this.handleHost(client, message.data);
    }
  }
}
