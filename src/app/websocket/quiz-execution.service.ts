import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { Server, Socket } from 'socket.io';

export type QuizStatus = 'waiting' | 'started';

@Injectable()
export class QuizExecutionService {
  private readonly logger = new Logger(QuizExecutionService.name);

  // Gestion de l'état d'exécution
  private executionHosts: Map<string, string> = new Map(); // executionId -> host clientId
  private executionParticipants: Map<string, Set<string>> = new Map(); // executionId -> Set<clientId>
  private currentQuestionIndex: Map<string, number> = new Map(); // executionId -> currentQuestionIndex

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async handleHostConnection(
    client: Socket,
    executionId: string
  ): Promise<any> {
    this.logger.log(
      `Host connection attempt for execution ${executionId} from ${client.id}`
    );

    // Récupérer l'exécution depuis Firestore
    const executionDoc = await this.firebase.firestore
      .collection('executions')
      .doc(executionId)
      .get();

    if (!executionDoc.exists) {
      throw new Error('Execution not found');
    }
    const executionData = executionDoc.data();

    // Récupérer le quiz associé
    const quizDoc = await this.firebase.firestore
      .collection('quizzes')
      .doc(executionData.quizId)
      .get();
    if (!quizDoc.exists) {
      throw new Error('Quiz not found');
    }
    const quizData = quizDoc.data();

    // Vérifier qu'il n'existe pas déjà un host
    const existingHost = this.executionHosts.get(executionId);
    if (existingHost && existingHost !== client.id) {
      throw new Error('This quiz already has an active host');
    }

    // Stocker le host et initialiser les structures
    this.executionHosts.set(executionId, client.id);
    this.currentQuestionIndex.set(executionId, -1);
    if (!this.executionParticipants.has(executionId)) {
      this.executionParticipants.set(executionId, new Set());
    }

    this.logger.log(`Host ${client.id} set for execution ${executionId}`);
    return quizData;
  }

  async handleJoinRequest(client: Socket, executionId: string): Promise<any> {
    this.logger.log(
      `Join request for execution ${executionId} from ${client.id}`
    );

    // Vérifier l'existence de l'exécution
    const executionDoc = await this.firebase.firestore
      .collection('executions')
      .doc(executionId)
      .get();
    if (!executionDoc.exists) {
      throw new Error('Execution not found');
    }

    // Récupérer le quiz
    const executionData = executionDoc.data();
    const quizDoc = await this.firebase.firestore
      .collection('quizzes')
      .doc(executionData.quizId)
      .get();
    if (!quizDoc.exists) {
      throw new Error('Quiz not found');
    }
    const quizData = quizDoc.data();

    // Ajouter le participant
    const participants = this.executionParticipants.get(executionId);
    participants.add(client.id);
    this.logger.log(
      `Added participant ${client.id} to execution ${executionId}`
    );
    return quizData;
  }

  async handleNextQuestion(client: Socket, executionId: string): Promise<any> {
    // Vérifier que le client est bien le host
    const hostId = this.executionHosts.get(executionId);
    if (hostId !== client.id) {
      throw new Error('Not authorized to control this quiz');
    }

    // Récupérer le quiz via Firestore
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
    const questions = quizData.questions || [];

    // Déterminer l'index de la prochaine question
    const currentIndex = this.currentQuestionIndex.get(executionId) ?? -1;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      throw new Error('No more questions available');
    }

    this.currentQuestionIndex.set(executionId, nextIndex);
    const currentQuestion = questions[nextIndex];

    if (
      !currentQuestion ||
      !currentQuestion.title ||
      !currentQuestion.answers
    ) {
      throw new Error('Invalid question format');
    }

    // Préparation de la charge utile
    const answers = currentQuestion.answers.map((answer) =>
      typeof answer === 'string'
        ? answer
        : answer.title || 'No answer available'
    );

    return {
      question: currentQuestion.title,
      answers,
    };
  }

  getParticipantCount(executionId: string): number {
    return this.executionParticipants.get(executionId)?.size || 0;
  }

  handleClientDisconnect(clientId: string): void {
    // Supprimer le client de toutes les structures
    for (const [executionId, hostId] of this.executionHosts.entries()) {
      if (hostId === clientId) {
        this.executionHosts.delete(executionId);
      }
    }
    for (const [
      executionId,
      participants,
    ] of this.executionParticipants.entries()) {
      if (participants.has(clientId)) {
        participants.delete(clientId);
      }
    }
  }
}
