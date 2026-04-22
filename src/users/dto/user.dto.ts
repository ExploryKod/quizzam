import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

/**
 * HTTP body for `POST /api/users` — only what the client sends; `user_id` / `uid` come from the JWT, not the body.
 * The command and repository use `CreateUserProfilePayload` (see `../payloads/`).
 */
export class CreateUserProfileBodyDto {
  @ApiProperty({
    example: 'amaury',
    description: 'Public username displayed in quiz application.',
    minLength: 1,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'username is required' })
  username: string;
}

/**
 * HTTP response for `GET /api/users/me` and OpenAPI. Built from `UserRecord` via `plainToInstance`.
 */
export class UserProfileResponseDto {
  @Expose()
  @ApiProperty({
    example: 'user-42',
    description: 'User unique identifier.',
  })
  uid: string;

  @Expose()
  @ApiProperty({
    example: 'amaury',
    description: 'Public username.',
  })
  username: string;
}