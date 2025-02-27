export type AnswerDTO = {
  title: string;
  isCorrect: boolean;
}

export type QuestionDTO = {
  id: string;
  title: string;
  answers: Array<AnswerDTO>;
}

export type QuizDTO = {
  id: string;
  description: string;
  questions: Array<QuestionDTO>;
  title: string;
};

export type basicQuizDTO = {
  id: string;
  title: string;
}

export type CreateQuizDTO = {
  title: string;
  description: string;
  userId: string;
}

