/**
 * Input for {@link CreateQuizCommand} and quiz repositories; `userId` is set in the controller from the JWT, not from the request body.
 */
export type CreateQuizPayload = {
  title: string;
  description: string;
  userId: string;
};
