export type DecodedToken = {
  user_id: string;
}

export type AnswerDTO = {
  title: string;
  isCorrect: boolean;
}

export type QuestionDTO = {
  id: string;
  title: string;
  answers: Array<AnswerDTO>;
}


export class CreateQuestionDTO {
  title: string;
  answers: AnswerDTO[];
}

export class UpdateQuestionDTO {
  title: string;
  answers: AnswerDTO[];
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

export class PatchOperation {
  op: string;
  path: string;
  value: string;
}
