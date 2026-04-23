import { DecodedToken } from './decoded-token.model';

/** Input for {@link StartQuizQuery} (not exposed as a JSON request body in this form on the public API). */
export type StartQuizPayload = {
  quizId: string;
  decodedToken: DecodedToken;
  baseUrl: string;
};
