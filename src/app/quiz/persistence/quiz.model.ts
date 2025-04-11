export interface FirestoreQuiz {
  id?: string;
  title: string;
  description: string;
  userId: string;
  questions: FirestoreQuestion[];
  updatedAt: Date;
}

export interface FirestoreQuestion {
  id: string;
  title: string;
  answers: FirestoreAnswer[];
}

export interface FirestoreAnswer {
  title: string;
  isCorrect: boolean;
} 