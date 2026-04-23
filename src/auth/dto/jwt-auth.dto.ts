import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

/** HTTP body for `POST /api/auth/register`. */
export class JwtRegisterRequestDto {
  @ApiProperty({ example: 'amaury', description: 'Username for the new account.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: 'amaury@example.com', description: 'User email.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Plain password.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  password: string;
}

/** HTTP body for `POST /api/auth/login`. */
export class JwtLoginRequestDto {
  @ApiProperty({ example: 'amaury@example.com', description: 'User email.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Plain password.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  password: string;
}

/** User profile embedded in {@link JwtAuthResponseDto}. */
export class JwtAuthUserDto {
  @ApiProperty({
    example: 'amaury@example.com',
    description: 'Authenticated user email.',
  })
  email: string;

  @ApiProperty({
    example: 'bf2b6811-78fd-4ab6-b8fa-962988eb43bc',
    description: 'Authenticated user unique identifier.',
  })
  uid: string;

  @ApiProperty({
    example: 'amaury',
    description: 'Authenticated user username.',
  })
  username: string;
}

/** HTTP response for `POST /api/auth/register` and `POST /api/auth/login`. */
export class JwtAuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signed JWT access token.',
  })
  token: string;

  @ApiProperty({
    type: JwtAuthUserDto,
    description: 'Authenticated user profile payload.',
  })
  user: JwtAuthUserDto;
}
