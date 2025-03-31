import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface ExecutionSession {
  hostId: string;
  participants: Set<string>;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class QuizSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger = new Logger('QuizSocketGateway');
  private executionSessions: Map<string, ExecutionSession> = new Map();

  @SubscribeMessage('host')
  handleHost(@MessageBody() payload: { executionId: string }, client: Socket) {
    const { executionId } = payload;

    if (!this.executionSessions.has(executionId)) {
      this.executionSessions.set(executionId, { hostId: client.id, participants: new Set() });
    } else {
      const session = this.executionSessions.get(executionId);
      if (session) session.hostId = client.id;
    }

    // Fetch the quiz details (mocked here)
    const quiz = { title: `Quiz for ${executionId}` };

    // Send `hostDetails` only to the host
    client.emit('hostDetails', { quiz });

    // Send `status` to all participants
    this.updateStatus(executionId);
  }

  private updateStatus(executionId: string) {
    const session = this.executionSessions.get(executionId);
    if (!session) return;

    this.server.to(executionId).emit('status', {
      status: 'waiting',
      participants: session.participants.size,
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove the client from any execution session
    this.executionSessions.forEach((session, executionId) => {
      if (session.hostId === client.id) {
        this.executionSessions.delete(executionId);
      } else if (session.participants.has(client.id)) {
        session.participants.delete(client.id);
        this.updateStatus(executionId);
      }
    });
  }
}
