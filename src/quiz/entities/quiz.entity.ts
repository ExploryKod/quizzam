import { Entity } from '../../shared/entity';
import { User } from '../../users/entities/user.entity';

export type Answer = {
  isCorrect: boolean;
  title: string;
}

export type Question = {
  id: string;
  title: string;
  answers: Answer[];
}

type QuizProps = {
  id: string;
  title: string;
  description: string;
  questions: Array<Question>;
  userId: string;
};

export class Quiz extends Entity<QuizProps> {

  quizHasNoTitle(): boolean {
    return this.props.title.length < 1;
  }

  quizHasNoQuestion(): boolean {
    return this.props.questions.length < 1;
  }

  quizHasValidQuestions(questions: Question[]): boolean {
    return questions.every((question: Question) => this.isQuestionValid(question));
  }

  isUserOwnQuiz(user: User): boolean {
    return this.props.userId === user.props.uid;
  }

  /**
   * Vérifie si une question est valide selon les critères spécifiés
   * @param question Objet question à vérifier
   * @returns Booléen indiquant si la question est valide
   */
  private isQuestionValid(question: Question): boolean {
    // Critère 1: La question doit avoir un titre non vide
    if (!question.title || question.title.trim() === '') {
      return false;
    }

    // Critère 2: La question doit avoir au moins deux réponses
    if (!question.answers || question.answers.length < 2) {
      return false;
    }

    // Critère 3: Il doit y avoir exactement une réponse correcte
    const correctAnswersCount = question.answers.filter(
      (answer: Answer) => answer.isCorrect
    ).length;
    return correctAnswersCount === 1;
  }
}
