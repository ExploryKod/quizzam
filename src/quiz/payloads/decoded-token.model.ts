/**
 * User identity from JWT decode — used by commands, queries, repositories (not a client HTTP body by itself).
 */
export class DecodedToken {
  user_id: string;
}
