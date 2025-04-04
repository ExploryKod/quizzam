export interface IQuiz {
  id: string;
  title: string;
  description: string;
  userId: string;
  questions?: IQuestion[];
}

export interface IQuestion {
  id: string;
  title: string;
  answers: IAnswer[];
}

export interface IAnswer {
  title: string;
  isCorrect: boolean;
}