import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';

interface ExecutionSession {
  host: WebSocket | null;
  participants: Set<WebSocket>;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class QuizWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger = new Logger('QuizWebSocketGateway');
  private executionSessions: Map<string, ExecutionSession> = new Map();

  handleConnection(client: WebSocket) {
    this.logger.log(`Client connected`);
    client.on('message', (message: string) => {
      try {
        const { name, data } = JSON.parse(message);
        if (name === 'host') {
          this.handleHost(data, client);
        }
      } catch (error) {
        this.logger.error('Invalid message format', error);
      }
    });
  }

  private handleHost(data: { executionId: string }, client: WebSocket) {
    const { executionId } = data;

    if (!this.executionSessions.has(executionId)) {
      this.executionSessions.set(executionId, { host: client, participants: new Set() });
    } else {
      const session = this.executionSessions.get(executionId);
      if (session) session.host = client;
    }

    // Fetch the quiz details (mocked here)
    const quiz = { title: `Quiz for ${executionId}` };

    // Send `hostDetails` only to the host
    client.send(JSON.stringify({ name: 'hostDetails', data: { quiz } }));

    // Send `status` to all participants
    this.updateStatus(executionId);
  }

  private updateStatus(executionId: string) {
    const session = this.executionSessions.get(executionId);
    if (!session) return;

    const statusPayload = JSON.stringify({
      name: 'status',
      data: { status: 'waiting', participants: session.participants.size },
    });

    session.participants.forEach(participant => participant.send(statusPayload));
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log(`Client disconnected`);

    // Remove the client from any execution session
    this.executionSessions.forEach((session, executionId) => {
      if (session.host === client) {
        this.executionSessions.delete(executionId);
      } else if (session.participants.has(client)) {
        session.participants.delete(client);
        this.updateStatus(executionId);
      }
    });
  }
}
