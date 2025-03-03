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


@WebSocketGateway({ cors: { origin: '*' } })
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('QuizGateway');

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }

  // This will be triggered when a client connects to a quiz session
  handleConnection(socket: Socket, quizId: string) {
    this.logger.log(`Socket quiz connected: ${socket.id}`);
    // Join the room related to the quizId
    socket.join(quizId);

    // Emit the current number of participants and quiz status to all connected clients
    this.server.to(quizId).emit('status', {
      status: 'waiting',
      participants: this.server.sockets.adapter.rooms.get(quizId)?.size || 0,
    });

    // Send host details to the host only
    socket.emit('hostDetails', { quiz: { title: 'Quiz Title' } });
  }

  // Emit status updates (e.g., quiz starting, etc.)
  notifyParticipants(quizId: string, status: string, participants: number) {
    this.server.to(quizId).emit('status', { status, participants });
  }

  // Emit host details to the host (quiz owner)
  notifyHost(quizId: string, quizTitle: string) {
    this.server.to(quizId).emit('hostDetails', { quiz: { title: quizTitle } });
  }
}
