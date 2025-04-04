/**
 * Erreur levée lorsqu'un quiz n'est pas trouvé
 */
export class QuizNotFoundError extends Error {
  constructor(quizId: string) {
    super(`Quiz non trouvé: ${quizId}`);
    this.name = 'QuizNotFoundError';
  }
}

/**
 * Erreur levée lorsqu'une question n'est pas trouvée
 */
export class QuestionNotFoundError extends Error {
  constructor(questionId: string, quizId: string) {
    super(`Question non trouvée: ${questionId} dans le quiz ${quizId}`);
    this.name = 'QuestionNotFoundError';
  }
}

/**
 * Erreur levée lorsqu'un utilisateur n'est pas autorisé à accéder à un quiz
 */
export class UnauthorizedQuizAccessError extends Error {
  constructor(userId: string, quizId: string) {
    super(`Utilisateur ${userId} non autorisé à accéder au quiz ${quizId}`);
    this.name = 'UnauthorizedQuizAccessError';
  }
}

/**
 * Erreur levée lorsqu'un quiz ne peut pas démarrer
 */
export class QuizNotStartableError extends Error {
  constructor(quizId: string, reason: string) {
    super(`Le quiz ${quizId} ne peut pas démarrer: ${reason}`);
    this.name = 'QuizNotStartableError';
  }
}

/**
 * Erreur levée lorsqu'un quiz a déjà été démarré
 */
export class QuizAlreadyStartedError extends Error {
  constructor(quizId: string) {
    super(`Le quiz ${quizId} a déjà été démarré`);
    this.name = 'QuizAlreadyStartedError';
  }
}
