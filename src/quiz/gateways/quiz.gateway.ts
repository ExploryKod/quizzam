import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { IQuizGateway } from '../ports/quiz-gateway.interface';

@WebSocketGateway({ cors: { origin: '*' } })
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect, IQuizGateway {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('QuizGateway');
  private hosts: Map<string, Socket> = new Map(); // Track the host for each executionId
  private participants: Map<string, Set<string>> = new Map(); // Track participants for each executionId

  // Handle the 'host' event (host starts the quiz)
  @SubscribeMessage('host')
  handleHost(@MessageBody() executionId: string): void {
    //this.logger.log(`Host connected to quiz with executionId: ${executionId.toString()}`);

    // Store the host for this executionId
    const hostSocket = this.hosts.get(executionId);
    if (hostSocket) {
      // Emit host details to the host (just the quiz title for now)
      const quizTitle = this.getQuizTitle(executionId);
      hostSocket.emit('hostDetails', { quiz: { title: quizTitle } });

      // Emit status (waiting) to all participants (including the host)
      this.broadcastStatus(executionId);
    }
  }

  // Handle the 'join' event (participants join the quiz)
  @SubscribeMessage('join')
  handleJoin(@MessageBody() executionId: string, socket: Socket): void {
    this.logger.log(`Player joining quiz with executionId: ${executionId}`);

    // Track the participant
    this.addParticipant(executionId, socket.id);

    // Emit join details (quiz title) to the joining player
    const quizTitle = this.getQuizTitle(executionId);
    socket.emit('joinDetails', { quizTitle });

    // Emit status (waiting) to all participants (including the host)
    this.broadcastStatus(executionId);
  }

  // Handle the 'nextQuestion' event (host proceeds to next question)
  @SubscribeMessage('nextQuestion')
  handleNextQuestion(@MessageBody() executionId: string, socket: Socket): void {
    const hostSocket = this.hosts.get(executionId);

    // Ensure the socket is the host
    if (hostSocket && hostSocket.id === socket.id) {
      const questionData = this.getNextQuestion(executionId);

      // Emit status (started) to all participants
      this.broadcastStatus(executionId);

      // Emit the new question to all participants
      this.server.to(executionId).emit('newQuestion', questionData);
    } else {
      socket.emit('error', { message: 'You are not the host of this session.' });
    }
  }

  // Broadcast status (participants count) to all clients connected to the executionId
  broadcastStatus(executionId: string): void {
    const participantCount = this.participants.get(executionId)?.size || 0;
    this.server.to(executionId).emit('status', {
      status: 'waiting', // or 'started' when the quiz is in progress
      participants: participantCount,
    });
  }

  // Notify participants with the current status and participant count
  notifyParticipants(executionId: string, status: string, participantsCount: number): void {
    this.server.to(executionId).emit('status', {
      status,
      participants: participantsCount,
    });
  }

  // Add a participant to the quiz
  private addParticipant(executionId: string, participantId: string): void {
    if (!this.participants.has(executionId)) {
      this.participants.set(executionId, new Set());
    }
    this.participants.get(executionId).add(participantId);
  }

  // Method to retrieve the quiz title (mocked for now)
  private getQuizTitle(executionId: string): string {
    // In a real scenario, retrieve the quiz title from the database or a service
    return 'Sample Quiz Title';
  }

  // Method to get the next question (mocked for now)
  private getNextQuestion(executionId: string): { question: string, answers: string[] } {
    // In a real scenario, you would retrieve the question from the database or a question pool
    return { question: 'What is the capital of France?', answers: ['Paris', 'London', 'Berlin', 'Rome'] };
  }

  // Handle a connection event (e.g., when the host or participant connects)
  handleConnection(socket: Socket): void {
    this.logger.log(`Socket connected: ${socket.id}`);
  }

  // Handle a disconnection event (e.g., when a participant or host disconnects)
  handleDisconnect(socket: Socket): void {
    this.logger.log(`Socket disconnected: ${socket.id}`);

    // Remove participant from the quiz session if necessary
    for (const [executionId, participants] of this.participants.entries()) {
      if (participants.has(socket.id)) {
        this.removeParticipant(executionId, socket.id);
        this.broadcastStatus(executionId); // Update status for all connected participants
        break;
      }
    }
  }

  // Method to remove a participant from the quiz session
  private removeParticipant(executionId: string, participantId: string): void {
    if (this.participants.has(executionId)) {
      const participants = this.participants.get(executionId);
      participants.delete(participantId);
      if (participants.size === 0) {
        this.participants.delete(executionId);
      }
    }
  }
}
