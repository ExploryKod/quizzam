import { ApiProperty } from '@nestjs/swagger';

export class Answer {
  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  title: string;
}

export class Question {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [Answer] })
  answers: Answer[];
}

export class QuizEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [Question] })
  questions: Question[];

  @ApiProperty()
  userId: string;
}

export class Quiz extends QuizEntity {
  constructor(data: QuizEntity) {
    super();
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.questions = data.questions;
    this.userId = data.userId;
  }

  // You can uncomment and use these methods if needed
  // quizHasNoTitle(): boolean {
  //   return this.title.length < 1;
  // }

  // quizHasNoQuestion(): boolean {
  //   return this.questions.length < 1;
  // }

  // quizHasValidQuestions(questions: Question[]): boolean {
  //   return questions.every((question: Question) => this.isQuestionValid(question));
  // }

  // isUserOwnQuiz(user: User): boolean {
  //   return this.userId === user.id;
  // }

  // private isQuestionValid(question: Question): boolean {
  //   if (!question.title || question.title.trim() === '') {
  //     return false;
  //   }

  //   if (!question.answers || question.answers.length < 2) {
  //     return false;
  //   }

  //   const correctAnswersCount = question.answers.filter(
  //     (answer: Answer) => answer.isCorrect
  //   ).length;
  //   return correctAnswersCount === 1;
  // }
}
