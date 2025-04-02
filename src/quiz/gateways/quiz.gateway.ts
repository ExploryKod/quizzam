import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Logger, NotFoundException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Question } from '../entities/quiz.entity';
import { GetQuizByExecutionIdQuery } from '../queries/get-quiz-by-executionId';
import { AnswerDTO, NextQuestionEventDto } from '../dto/quiz.dto';

type QuizStatus = "waiting" | "started" | "completed";

export interface HostJoinPayload {
  executionId: string;
}

export interface StatusEvent {
  status: string;
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

type AnswerEvent = string

export interface QuestionEvent {
  question: string;
  answers: Array<AnswerEvent>;
}

export interface JoinPayload {
  executionId: string;
}

export interface JoinDetailsEvent {
  id?: string;
  quizTitle: string;
  description?: string;
  questions?: Question[];
}

@WebSocketGateway({ cors: { origin: 'http://localhost:4200' } })
export class QuizGateway {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(QuizGateway.name);
  private readonly quizId: string;
  private executionRooms: Map<string, Set<string>> = new Map();
  private hostClients: Map<string, string> = new Map();
  private executionQuestionIndexes: Map<string, number> = new Map();
  private executionStatus: Map<string, QuizStatus> = new Map();

  constructor(
    private readonly getQuizByExecutionIdQuery : GetQuizByExecutionIdQuery,
  ) {
  }

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

    const quiz = await this.getQuizByExecutionIdQuery.execute(executionId);
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

  @SubscribeMessage('join')
  async handlePlayerJoin(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() client: Socket
  ) {
    const { executionId } = payload;
    console.log("[participant - subscribed message] execution id ", executionId);

    if (!this.executionRooms.has(executionId)) {
      throw new NotFoundException(`Quiz execution ${executionId} not found`);
    }

    client.join(executionId);
    this.executionRooms.get(executionId).add(client.id);

    const quiz = await this.getQuizByExecutionIdQuery.execute(executionId);
    console.log("quiz in websocket participant is: ", quiz);

    const joinDetails: JoinDetailsEvent = {
      quizTitle: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
    };
    client.emit('joinDetails', joinDetails);

    const statusEvent: StatusEvent = {
      status: 'starting',
      participants: this.executionRooms.get(executionId).size
    };
    this.server.to(executionId).emit('status', statusEvent);

    this.logger.log(`Player joined execution: ${executionId}`);
  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(
    @MessageBody() payload: HostJoinPayload,
    @ConnectedSocket() client: Socket
  ) {
    const { executionId } = payload;

    const quiz = await this.getQuizByExecutionIdQuery.execute(executionId);

    const hostClientId = this.hostClients.get(executionId);
    if (client.id !== hostClientId) {
      this.logger.warn(`Unauthorized client tried to move to next question for execution: ${executionId}`);
      return;
    }

    const statusEvent: StatusEvent = {
      status: 'started',
      participants: this.executionRooms.get(executionId).size
    };
    this.server.to(executionId).emit('status', statusEvent);
    this.logger.log(`Trigger started for execution: ${executionId}`);

    const nextQuestionResults = this.getNextQuestion(
      executionId,
      quiz.questions
    );
    if(nextQuestionResults.questionNumber <= nextQuestionResults.totalQuestions) {
      this.server.to(executionId).emit('newQuestion', nextQuestionResults);
      this.logger.log(`Moved to next question for execution: ${executionId}`);
    } else {
      this.logger.log(`The quiz session n° ${executionId} is completed`);
    }
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

  private getNextQuestion(executionId: string, questions: Question[]): NextQuestionEventDto {

    const currentIndex = this.executionQuestionIndexes.get(executionId) ?? -1;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      return {
        question: "Merci pour votre participation, le quiz est terminé",
        questionNumber: questions.length,
        answers: [],
        totalQuestions: questions.length,
      }
    }
    this.executionQuestionIndexes.set(executionId, nextIndex);
    const currentQuestion = questions[nextIndex];
    if (
      !currentQuestion ||
      !currentQuestion.title ||
      !currentQuestion.answers
    ) {
      throw new Error('Invalid question format');
    }

    const answers: string[] = currentQuestion.answers.map((answer: AnswerDTO) =>
      typeof answer === 'string'
        ? answer
        : answer.title || 'No answer available'
    );
    return {
      question: currentQuestion.title,
      questionNumber: nextIndex + 1,
      answers,
      totalQuestions: questions.length,
    };
  }
}
