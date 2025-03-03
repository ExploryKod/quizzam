import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GetQuizByIdQuery } from '../queries/get-quiz-by-id';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private hosts: Map<string, string> = new Map(); // Stores executionId -> hostSocketId
  private executionParticipants: Map<string, Set<string>> = new Map(); // Stores executionId -> participantSocketIds

  constructor(private readonly getQuizByIdQuery: GetQuizByIdQuery) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Check if the client is a host
    for (const [executionId, hostSocketId] of this.hosts.entries()) {
      if (hostSocketId === client.id) {
        this.hosts.delete(executionId);
        this.executionParticipants.delete(executionId);
        console.log(`Host disconnected for executionId: ${executionId}`);
        return;
      }
    }

    // Check if the client is a participant
    for (const [executionId, participants] of this.executionParticipants.entries()) {
      if (participants.has(client.id)) {
        participants.delete(client.id);
        console.log(`Participant disconnected from executionId: ${executionId}`);
        this.broadcastStatus(executionId);
        return;
      }
    }
  }

  // @SubscribeMessage('host')
  // async handleHostEvent(
  //   @MessageBody() data: { executionId: string },
  //   @ConnectedSocket() client: Socket
  // ) {
  //   const { executionId } = data;
  //   console.log(`Host connected for executionId: ${executionId}`);
  //
  //   try {
  //     const quiz = await this.getQuizByIdQuery.execute(executionId);
  //
  //     if (!quiz) {
  //       client.emit('error', { message: 'Quiz not found' });
  //       return;
  //     }
  //
  //     // Store host socket ID
  //     this.hosts.set(executionId, client.id);
  //     this.executionParticipants.set(executionId, new Set());
  //
  //     // Send hostDetails only to the host
  //     client.emit('hostDetails', { quiz: { title: quiz.props.title } });
  //
  //     // Send status to everyone connected to this execution
  //     this.broadcastStatus(executionId);
  //   } catch (error) {
  //     console.error('Error fetching quiz:', error);
  //     client.emit('error', { message: 'Internal server error' });
  //   }
  // }

  @SubscribeMessage('host')
  async handleHostEvent(
    @MessageBody() data: { executionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { executionId } = data;
    console.log(`🔍 Checking executionId: ${executionId}`); // Debug log

    try {
      const quiz = await this.getQuizByIdQuery.execute(executionId);

      if (!quiz) {
        console.log(`❌ Quiz not found for executionId: ${executionId}`);
        client.emit('error', { message: 'Quiz not found' });
        return;
      }

      console.log(`✅ Quiz found: ${quiz.props.title}`); // Debug log

      this.hosts.set(executionId, client.id);
      this.executionParticipants.set(executionId, new Set());

      client.emit('hostDetails', { quiz: { title: quiz.props.title } });

      this.broadcastStatus(executionId);
    } catch (error) {
      console.error(`❌ Error fetching quiz for executionId: ${executionId}`, error);
      client.emit('error', { message: 'Internal server error' });
    }
  }

  private broadcastStatus(executionId: string) {
    const participantsCount = this.executionParticipants.get(executionId)?.size || 0;

    this.server.to(executionId).emit('status', {
      status: 'waiting',
      participants: participantsCount,
    });
  }
}
