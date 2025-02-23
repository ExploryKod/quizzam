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
