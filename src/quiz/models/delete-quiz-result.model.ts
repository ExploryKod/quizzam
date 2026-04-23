/** Result of a delete attempt: success payload or authorization hint (no HTTP DTO decorators). */
export type DeleteQuizResult = {
  id: string;
  userId?: string;
};
