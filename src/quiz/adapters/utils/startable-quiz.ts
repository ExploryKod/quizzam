import { Question } from '../../entities/quiz.entity';

/**
 * Détermine si un quiz est démarrable selon les critères spécifiés
 * @param title Titre du quiz
 * @param questions Tableau des questions du quiz
 * @returns Booléen indiquant si le quiz est démarrable
 */
export function isQuizStartable(title: string, questions: Question[]): boolean {

  if (!title || title.trim() === '') {
    return false;
  }

  if (!questions || questions.length === 0) {
    return false;
  }

  return questions.every((question) => isQuestionValid(question));
}

/**
 * Vérifie si une question est valide selon les critères spécifiés
 * @param question Objet question à vérifier
 * @returns Booléen indiquant si la question est valide
 */
function isQuestionValid(question: Question): boolean {

  if (!question.title || question.title.trim() === '') {
    return false;
  }

  if (!question.answers || question.answers.length < 2) {
    return false;
  }

  const correctAnswersCount = question.answers.filter(
    (answer) => answer.isCorrect
  ).length;
  return correctAnswersCount === 1;
}

/**
 * Génère un identifiant aléatoire de 6 caractères
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}