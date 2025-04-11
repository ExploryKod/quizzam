export interface Quiz {
  id: string;
  title: string;
  description: string;
  userId: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  title: string;
  answers: Answer[];
}

export interface Answer {
  title: string;
  isCorrect: boolean;
} 