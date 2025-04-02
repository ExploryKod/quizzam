import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { Server, Socket } from 'socket.io';

export type QuizStatus = 'waiting' | 'started' | 'completed';

@Injectable()
export class QuizExecutionService {
  private readonly logger = new Logger(QuizExecutionService.name);
  // Gestion de l'état d'exécution
  private executionHosts: Map<string, string> = new Map(); // executionId -> host clientId
  private executionParticipants: Map<string, Set<string>> = new Map(); // executionId -> Set<clientId>
  private currentQuestionIndex: Map<string, number> = new Map(); // executionId -> currentQuestionIndex
  private executionStatus: Map<string, QuizStatus> = new Map(); // executionId -> status
  private firstQuestionSent: Map<string, boolean> = new Map(); // executionId -> boolean

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}
  // Extrait la logique de vérification et d'initialisation pour l'hôte
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
    // Stocker le host
    this.executionHosts.set(executionId, client.id);
    this.executionStatus.set(executionId, 'waiting');
    this.currentQuestionIndex.delete(executionId);
    if (!this.executionParticipants.has(executionId)) {
      this.executionParticipants.set(executionId, new Set());
    }

    this.logger.log(`Host ${client.id} set for execution ${executionId}`);
    return quizData;
  }

  // Méthode pour gérer la demande de join
  async handleJoinRequest(client: Socket, executionId: string): Promise<any> {
    this.logger.log(
      `Join request for execution ${executionId} from ${client.id}`
    );
    // Vérifier ou initialiser l'exécution
    let status = this.executionStatus.get(executionId);
    if (!status || status !== 'waiting') {
      // Tentative de récupération en direct depuis Firestore (optionnel)
      const executionDoc = await this.firebase.firestore
        .collection('executions')
        .doc(executionId)
        .get();
      if (!executionDoc.exists) {
        throw new Error('Execution not found');
      }
      this.executionStatus.set(executionId, 'waiting');
      this.executionParticipants.set(executionId, new Set());
    }
    // Récupérer le quiz
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

    // Ajouter le participant
    const participants = this.executionParticipants.get(executionId);
    participants.add(client.id);
    this.logger.log(
      `Added participant ${client.id} to execution ${executionId}`
    );
    return quizData;
  }

  // Méthode pour gérer le passage à la question suivante
  async handleNextQuestion(client: Socket, executionId: string): Promise<any> {
    // Vérifier que le client est bien le host
    const hostId = this.executionHosts.get(executionId);
    if (hostId !== client.id) {
      throw new Error('Not authorized to control this quiz');
    }

    // Vérifier si c'est la première fois qu'on clique sur "Next Question"
    const currentStatus = this.executionStatus.get(executionId);
    if (currentStatus === 'waiting') {
      this.logger.log(
        `First click on nextQuestion - changing status to started only`
      );

      // Changer d'abord le statut à "started"
      this.executionStatus.set(executionId, 'started');

      // Retourner un message pour indiquer qu'il faut cliquer à nouveau
      return {
        firstClick: true,
        questionNumber: 0,
        message:
          "Le quiz a démarré. Cliquez à nouveau sur 'Question Suivante' pour afficher la première question.",
      };
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
      this.executionStatus.set(executionId, 'completed');
      return { completed: true };
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
      questionNumber: nextIndex + 1,
      answers,
      totalQuestions: questions.length,
    };
  }

  // Méthode pour le reset de l'exécution
  async resetExecution(executionId: string): Promise<any> {
    this.executionStatus.set(executionId, 'waiting');
    this.currentQuestionIndex.delete(executionId);
    this.firstQuestionSent.delete(executionId);
    return true;
  }

  // Méthode utilitaire pour obtenir le nombre de participants
  getParticipantCount(executionId: string): number {
    return this.executionParticipants.get(executionId)?.size || 0;
  }

  // Méthode pour la gestion de la déconnexion des clients,
  // éventuellement à appeler depuis le gateway
  handleClientDisconnect(clientId: string): void {
    // Supprimer le client de toutes les structures
    for (const [executionId, hostId] of this.executionHosts.entries()) {
      if (hostId === clientId) {
        this.executionHosts.delete(executionId);
        this.executionStatus.delete(executionId);
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

  // Méthode pour obtenir le statut actuel
  getStatus(executionId: string): QuizStatus {
    return this.executionStatus.get(executionId) || 'waiting';
  }
}
