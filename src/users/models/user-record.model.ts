/**
 * User profile as read from storage or JWT registry (no HTTP / Swagger concerns).
 * Maps to `UserProfileResponseDto` at the controller boundary.
 */
export type UserRecord = {
  uid: string;
  username: string;
};
