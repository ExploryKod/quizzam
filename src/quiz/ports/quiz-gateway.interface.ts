import { Socket } from 'socket.io';

export const I_QUIZ_GATEWAY = 'I_QUIZ_GATEWAY';

export interface IQuizGateway {
  // Notify the host when the quiz starts (with executionId)
  handleHost(executionId: string): void;

  // Notify participants about the quiz status (with executionId)
  notifyParticipants(executionId: string, status: string, participantsCount: number): void;

  // Handle when a participant joins the quiz
  handleJoin(executionId: string, socket: Socket): void;

  // Handle next question (e.g., when the host proceeds to the next question)
  handleNextQuestion(executionId: string, socket: Socket): void;

  // Broadcast the quiz status to all participants
  broadcastStatus(executionId: string): void;

}
