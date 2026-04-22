/**
 * AddUsername command / user repository input after resolving `uid` from the JWT
 * (not the raw HTTP body; see `CreateUserProfileBodyDto`).
 */
export type CreateUserProfilePayload = {
  uid: string;
  username: string;
};
