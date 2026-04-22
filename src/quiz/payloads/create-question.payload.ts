/**
 * Normalized question shape for persistence (add/replace question flows), after draft normalization if applicable.
 * Distinct from HTTP-only types in `../dto/`.
 */
export type CreateQuestionPayload = {
  title: string;
  answers: Array<{ title: string; isCorrect: boolean }>;
};
