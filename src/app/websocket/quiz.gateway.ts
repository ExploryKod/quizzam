import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';

interface HostPayload {
  executionId: string;
}

interface JoinPayload {
  executionId: string;
}

interface NextQuestionPayload {
  executionId: string;
}

type QuizStatus = 'waiting' | 'started' | 'completed';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();
  private executionHosts: Map<string, string> = new Map(); // executionId -> clientId
  private executionParticipants: Map<string, Set<string>> = new Map(); // executionId -> Set<clientId>
  private currentQuestionIndex: Map<string, number> = new Map(); // executionId -> currentQuestionIndex
  private executionStatus: Map<string, QuizStatus> = new Map(); // executionId -> status
  private firstQuestionSent: Map<string, boolean> = new Map(); // executionId -> boolean indicating if first question was sent

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async handleConnection(client: Socket) {
    console.log(`[Connection] New client connected: ${client.id}`);
    console.log(`[Connection] Client handshake:`, client.handshake);
    console.log(`[Connection] Transport type:`, client.conn.transport.name);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);

    // Remove host mapping if this client was a host
    for (const [executionId, hostId] of this.executionHosts.entries()) {
      if (hostId === client.id) {
        this.executionHosts.delete(executionId);
        this.executionStatus.delete(executionId);
        break;
      }
    }

    // Remove participant and update status if this client was a participant
    for (const [
      executionId,
      participants,
    ] of this.executionParticipants.entries()) {
      if (participants.has(client.id)) {
        participants.delete(client.id);
        this.broadcastStatus(executionId);
        break;
      }
    }
  }

  // Helper method to log and emit events
  private emitToRoom(room: string, event: string, data: any) {
    console.log(
      `[Emit] Sending event '${event}' to room '${room}':`,
      JSON.stringify(data)
    );
    this.server.to(room).emit(event, data);
  }

  private broadcastStatus(executionId: string) {
    const status = this.executionStatus.get(executionId);
    if (!status) {
      console.error(`[Status] No status found for execution ${executionId}`);
      return;
    }

    const participants = this.executionParticipants.get(executionId)?.size || 0;
    console.log(
      `[Status] Broadcasting status for ${executionId}: ${status} with ${participants} participants`
    );

    // Log the room info to check if clients are properly joined
    const roomClients = this.server.sockets.adapter.rooms.get(executionId);
    console.log(
      `[Status] Room ${executionId} has ${roomClients?.size || 0} clients`
    );

    // Even if there are no clients in the room, we still emit to the room
    // This handles the case where socket.io hasn't fully updated the room
    this.emitToRoom(executionId, 'status', {
      status,
      participants,
    });
    console.log(`[Status] Emitted status to room ${executionId}`);

    // For extra safety, emit to all connected clients who are participants or host
    const host = this.executionHosts.get(executionId);
    const participantSet =
      this.executionParticipants.get(executionId) || new Set();

    // If we have a host, make sure they get the status
    if (host && this.connectedClients.has(host)) {
      const hostClient = this.connectedClients.get(host);
      console.log(
        `[Emit] Sending event 'status' directly to host ${host}:`,
        JSON.stringify({ status, participants })
      );
      hostClient.emit('status', { status, participants });
      console.log(`[Status] Directly sent status to host ${host}`);
    }

    // Make sure all participants get the status
    participantSet.forEach((participantId) => {
      if (this.connectedClients.has(participantId)) {
        const participantClient = this.connectedClients.get(participantId);
        console.log(
          `[Emit] Sending event 'status' directly to participant ${participantId}:`,
          JSON.stringify({ status, participants })
        );
        participantClient.emit('status', { status, participants });
        console.log(
          `[Status] Directly sent status to participant ${participantId}`
        );
      }
    });
  }

  @SubscribeMessage('host')
  async handleHost(client: Socket, payload: HostPayload) {
    const { executionId } = payload;
    console.log(`=== [Host Event] ===`);
    console.log(
      `[Host Event] Received host connection attempt for execution ${executionId} from client ${client.id}`
    );
    console.log(
      `[Host Event] Current executions in memory:`,
      Array.from(this.executionStatus.keys())
    );

    try {
      // Get quiz details from Firestore
      console.log(
        `[Host Event] Fetching execution from Firestore: ${executionId}`
      );
      const executionDoc = await this.firebase.firestore
        .collection('executions')
        .doc(executionId)
        .get();

      if (!executionDoc.exists) {
        console.error(
          `[Host Event] Execution ${executionId} not found in Firestore`
        );
        client.emit('error', { message: 'Execution not found' });
        client.disconnect();
        return;
      }

      const executionData = executionDoc.data();
      console.log(
        `[Host Event] Fetching quiz from Firestore: ${executionData.quizId}`
      );
      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(executionData.quizId)
        .get();

      if (!quizDoc.exists) {
        console.error(
          `[Host Event] Quiz ${executionData.quizId} not found in Firestore`
        );
        client.emit('error', { message: 'Quiz not found' });
        client.disconnect();
        return;
      }

      const quizData = quizDoc.data();
      console.log(
        `[Host Event] Quiz found, title: "${quizData.title}", has ${
          quizData.questions?.length || 0
        } questions`
      );

      // Check if this execution already has a host
      const existingHost = this.executionHosts.get(executionId);
      if (
        existingHost &&
        existingHost !== client.id &&
        this.connectedClients.has(existingHost)
      ) {
        console.error(
          `[Host Event] Execution ${executionId} already has a host: ${existingHost}`
        );
        client.emit('error', {
          message: 'This quiz already has an active host',
        });
        client.disconnect();
        return;
      }

      // Store this client as the host for this execution
      this.executionHosts.set(executionId, client.id);
      console.log(
        `[Host Event] Set client ${client.id} as host for execution ${executionId}`
      );

      // Initialize execution status
      this.executionStatus.set(executionId, 'waiting');
      console.log(
        `[Host Event] Set status to 'waiting' for execution ${executionId}`
      );

      // Initialize or reset question index
      this.currentQuestionIndex.delete(executionId);
      console.log(
        `[Host Event] Reset question index for execution ${executionId}`
      );

      // Initialize participants set for this execution
      if (!this.executionParticipants.has(executionId)) {
        this.executionParticipants.set(executionId, new Set());
        console.log(
          `[Host Event] Initialized participants set for execution ${executionId}`
        );
      }

      // Join the execution room
      client.join(executionId);
      console.log(
        `[Host Event] Client ${client.id} joined room ${executionId}`
      );

      // Send host details only to the host
      client.emit('hostDetails', { quiz: quizData });
      console.log(`[Host Event] Sent hostDetails to client ${client.id}`);

      // Send initial status to all clients in this execution room including the host
      this.broadcastStatus(executionId);

      // Also send the status directly to the host to ensure they receive it
      const participants =
        this.executionParticipants.get(executionId)?.size || 0;
      client.emit('status', {
        status: 'waiting',
        participants,
      });
      console.log(
        `[Host Event] Sent status directly to host ${client.id}: waiting, ${participants} participants`
      );

      // Log that host setup is complete
      console.log(
        `[Host Event] Host setup complete for execution ${executionId}`
      );
    } catch (error) {
      console.error(`[Host Event] Error handling host connection:`, error);
      client.emit('error', {
        message: 'Error setting up host connection',
        details: error.message,
      });
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, payload: JoinPayload) {
    const { executionId } = payload;
    console.log(`=== [Join Event] ===`);
    console.log(
      `[Join Event] Received join request for execution ${executionId} from client ${client.id}`
    );
    console.log(
      `[Join Event] Current executions in memory:`,
      Array.from(this.executionStatus.keys())
    );

    try {
      // Check if execution exists and is in waiting state
      const status = this.executionStatus.get(executionId);
      console.log(
        `[Join Event] Status for execution ${executionId}: ${status}`
      );

      if (!status || status !== 'waiting') {
        console.error(
          `[Join Event] Execution ${executionId} not found or not in waiting state. Current status: ${status}`
        );

        // Try to recover by checking Firestore directly
        console.log(`[Join Event] Trying to recover by checking Firestore...`);
        const executionDoc = await this.firebase.firestore
          .collection('executions')
          .doc(executionId)
          .get();

        if (!executionDoc.exists) {
          console.error(
            `[Join Event] Execution ${executionId} not found in Firestore`
          );
          throw new Error('Execution not found');
        }

        const executionData = executionDoc.data();
        console.log(
          `[Join Event] Found execution in Firestore:`,
          executionData
        );

        // Initialize the execution in memory
        this.executionStatus.set(executionId, 'waiting');
        this.executionParticipants.set(executionId, new Set());
        console.log(
          `[Join Event] Recovery: Initialized execution ${executionId} with status 'waiting'`
        );
      }

      // Get quiz details from Firestore
      const executionDoc = await this.firebase.firestore
        .collection('executions')
        .doc(executionId)
        .get();

      if (!executionDoc.exists) {
        console.error(
          `[Join Event] Execution ${executionId} not found in Firestore`
        );
        throw new Error('Execution not found');
      }

      const executionData = executionDoc.data();
      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(executionData.quizId)
        .get();

      if (!quizDoc.exists) {
        console.error(
          `[Join Event] Quiz ${executionData.quizId} not found in Firestore`
        );
        throw new Error('Quiz not found');
      }

      const quizData = quizDoc.data();

      // Add participant to the execution
      const participants = this.executionParticipants.get(executionId);
      if (!participants) {
        console.error(
          `[Join Event] No participants set found for execution ${executionId}`
        );
        throw new Error('Execution not properly initialized');
      }

      // Add participant to the set
      participants.add(client.id);

      // Join the execution room after all checks are passed
      client.join(executionId);

      // Send joinDetails event with quiz title
      client.emit('joinDetails', { quizTitle: quizData.title });
      console.log(
        `[Join Event] Sent joinDetails to client ${client.id} for quiz "${quizData.title}"`
      );

      // Send status event with current status and participant count
      client.emit('status', {
        status: 'waiting',
        participants: participants.size,
      });
      console.log(
        `[Join Event] Sent status to client ${client.id}: waiting, ${participants.size} participants`
      );

      // Broadcast updated status to all participants
      this.broadcastStatus(executionId);
    } catch (error) {
      console.error(`[Join Event] Error handling join request:`, error);
      client.disconnect();
    }
  }

  @SubscribeMessage('nextQuestion')
  async handleNextQuestion(client: Socket, payload: NextQuestionPayload) {
    const { executionId } = payload;
    console.log(`=== [Next Question] ===`);
    console.log(
      `[Next Question] Received next question request for execution ${executionId} from client ${client.id}`
    );

    try {
      // Verify this client is the host
      const hostId = this.executionHosts.get(executionId);
      console.log(
        `[Next Question] Checking host: expected=${hostId}, actual=${
          client.id
        }, isHost=${hostId === client.id}`
      );

      if (!hostId || hostId !== client.id) {
        console.error(
          `[Next Question] Client ${client.id} is not the host for execution ${executionId}`
        );
        // Envoyer un message d'erreur au client au lieu de le déconnecter
        client.emit('error', {
          message: 'Not authorized to control this quiz',
        });
        return; // Sortir de la fonction sans déconnecter
      }

      // Log current execution state
      console.log(`[Next Question] Current execution state:`, {
        status: this.executionStatus.get(executionId),
        currentIndex: this.currentQuestionIndex.get(executionId),
        hasParticipants: this.executionParticipants.has(executionId),
        participantsCount:
          this.executionParticipants.get(executionId)?.size || 0,
        firstQuestionSent: this.firstQuestionSent.get(executionId) || false,
      });

      // Vérifier si c'est la première fois qu'on clique sur "Next Question"
      const currentStatus = this.executionStatus.get(executionId);
      if (currentStatus === 'waiting') {
        console.log(
          `[Next Question] First click - changing status to started only`
        );

        // Changer d'abord le statut à "started"
        this.executionStatus.set(executionId, 'started');
        this.broadcastStatus(executionId);
        console.log(
          `[Next Question] Status changed to started, waiting for next click to send first question`
        );

        // Notifier l'hôte que nous attendons le prochain clic pour envoyer la première question
        client.emit('questionSent', {
          questionNumber: 0,
          message:
            "Le quiz a démarré. Cliquez à nouveau sur 'Question Suivante' pour afficher la première question.",
        });

        return;
      }

      // Get quiz details from Firestore
      console.log(
        `[Next Question] Fetching execution from Firestore: ${executionId}`
      );
      const executionDoc = await this.firebase.firestore
        .collection('executions')
        .doc(executionId)
        .get();

      if (!executionDoc.exists) {
        console.error(
          `[Next Question] Execution ${executionId} not found in Firestore`
        );
        client.emit('error', { message: 'Execution not found' });
        return;
      }

      const executionData = executionDoc.data();
      console.log(
        `[Next Question] Fetching quiz from Firestore: ${executionData.quizId}`
      );
      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(executionData.quizId)
        .get();

      if (!quizDoc.exists) {
        console.error(
          `[Next Question] Quiz ${executionData.quizId} not found in Firestore`
        );
        client.emit('error', { message: 'Quiz not found' });
        return;
      }

      const quizData = quizDoc.data();
      const questions = quizData.questions || [];
      console.log(`[Next Question] Quiz has ${questions.length} questions`);

      // Get current question index
      const currentIndex =
        this.currentQuestionIndex.get(executionId) === undefined
          ? -1
          : this.currentQuestionIndex.get(executionId);
      const nextIndex = currentIndex + 1;
      console.log(`[Next Question] Moving to question index: ${nextIndex}`);

      // Check if we have more questions
      if (nextIndex >= questions.length) {
        console.log(
          `[Next Question] No more questions for execution ${executionId}`
        );
        // Update status to completed
        this.executionStatus.set(executionId, 'completed');
        this.broadcastStatus(executionId);
        client.emit('quizCompleted');
        return;
      }

      // Store new current index
      this.currentQuestionIndex.set(executionId, nextIndex);

      // Get current question
      const currentQuestion = questions[nextIndex];

      console.log(
        `[Next Question] Current question:`,
        JSON.stringify(currentQuestion)
      );

      // Check if question has the expected structure
      if (
        !currentQuestion ||
        !currentQuestion.title ||
        !currentQuestion.answers
      ) {
        console.error(
          `[Next Question] Invalid question structure:`,
          currentQuestion
        );
        client.emit('error', { message: 'Invalid question format' });
        return;
      }

      // Extract answers safely
      const answers = currentQuestion.answers.map((answer) => {
        // Check the structure of the answer to extract the title correctly
        if (typeof answer === 'string') {
          return answer;
        } else if (answer && typeof answer === 'object') {
          // Try to extract title, or any property that might contain the answer text
          if (answer.title) return answer.title;
          if (answer.text) return answer.text;
          if (answer.content) return answer.content;
          if (answer.value) return answer.value;

          // Last resort: convert to string if possible
          return String(answer);
        }
        return 'No answer available';
      });

      console.log(
        `[Next Question] Extracted answers:`,
        JSON.stringify(answers)
      );

      // Create the payload
      const questionPayload = {
        question: currentQuestion.title,
        questionNumber: nextIndex + 1,
        answers: answers,
        totalQuestions: questions.length,
      };

      console.log(
        `[Next Question] Sending payload:`,
        JSON.stringify(questionPayload)
      );

      // Envoyer la question à tous les participants
      this.emitToRoom(executionId, 'newQuestion', questionPayload);
      console.log(
        `[Next Question] Sent question "${currentQuestion.title}" to room ${executionId}`
      );

      // Si c'est la première question, marquer que la première question a été envoyée
      if (nextIndex === 0) {
        this.firstQuestionSent.set(executionId, true);
        console.log(
          `[Next Question] Marked first question as sent for execution ${executionId}`
        );
      }

      // Confirm to the host that the question was sent successfully
      client.emit('questionSent', { questionNumber: nextIndex + 1 });

      console.log(
        `[Next Question] After incrementing, currentIndex=${nextIndex}, stored value=${this.currentQuestionIndex.get(
          executionId
        )}`
      );

      console.log(
        `[Next Question] At end of function, stored index is now: ${this.currentQuestionIndex.get(
          executionId
        )}`
      );
    } catch (error) {
      console.error(`[Next Question] Error handling next question:`, error);

      // Envoyer une notification d'erreur au client au lieu de le déconnecter
      client.emit('error', {
        message: 'Error processing next question request',
        details: error.message,
      });

      // Ne pas déconnecter le client, juste logger l'erreur
      // client.disconnect();
    }
  }

  @SubscribeMessage('resetExecution')
  async handleResetExecution(client: Socket, payload: { executionId: string }) {
    const { executionId } = payload;
    console.log(`=== [Reset Execution] ===`);
    console.log(
      `[Reset Execution] Request to reset execution ${executionId} from client ${client.id}`
    );

    try {
      // Check if this client is the host
      const hostId = this.executionHosts.get(executionId);
      if (hostId !== client.id) {
        console.error(
          `[Reset Execution] Client ${client.id} is not authorized to reset execution ${executionId}`
        );
        return;
      }

      // Get execution from Firestore
      const executionDoc = await this.firebase.firestore
        .collection('executions')
        .doc(executionId)
        .get();

      if (!executionDoc.exists) {
        console.error(
          `[Reset Execution] Execution ${executionId} not found in Firestore`
        );
        return;
      }

      const executionData = executionDoc.data();

      // Reset the execution state
      this.executionStatus.set(executionId, 'waiting');
      this.currentQuestionIndex.delete(executionId);
      this.firstQuestionSent.delete(executionId);

      // Keep the participants but notify them of the reset
      const participants = this.executionParticipants.get(executionId);
      if (participants) {
        participants.forEach((participantId) => {
          if (this.connectedClients.has(participantId)) {
            this.connectedClients.get(participantId).emit('executionReset');
          }
        });
      }

      console.log(
        `[Reset Execution] Execution ${executionId} has been reset to 'waiting' state`
      );

      // Broadcast the new status
      this.broadcastStatus(executionId);

      // Re-send host details
      const quizDoc = await this.firebase.firestore
        .collection('quizzes')
        .doc(executionData.quizId)
        .get();

      if (quizDoc.exists) {
        const quizData = quizDoc.data();
        client.emit('hostDetails', { quiz: quizData });
        console.log(
          `[Reset Execution] Re-sent hostDetails to client ${client.id}`
        );
      }
    } catch (error) {
      console.error(`[Reset Execution] Error:`, error);
    }
  }
}
