import { ApiProperty } from '@nestjs/swagger';

export class JwtRegisterRequestDto {
  @ApiProperty({ example: 'amaury', description: 'Username for the new account.' })
  username: string;

  @ApiProperty({ example: 'amaury@example.com', description: 'User email.' })
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Plain password.' })
  password: string;
}

export class JwtLoginRequestDto {
  @ApiProperty({ example: 'amaury@example.com', description: 'User email.' })
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Plain password.' })
  password: string;
}

export class JwtAuthUserDto {
  @ApiProperty({ example: 'amaury@example.com' })
  email: string;

  @ApiProperty({ example: 'bf2b6811-78fd-4ab6-b8fa-962988eb43bc' })
  uid: string;

  @ApiProperty({ example: 'amaury' })
  username: string;
}

export class JwtAuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signed JWT access token.',
  })
  token: string;

  @ApiProperty({ type: JwtAuthUserDto })
  user: JwtAuthUserDto;
}
