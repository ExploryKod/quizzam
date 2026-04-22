import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user-42',
    description: 'User unique identifier (typically sourced from authentication token).',
    required: false,
  })
  uid: string

  @ApiProperty({
    example: 'amaury',
    description: 'Public username displayed in quiz application.',
  })
  username: string;
}

export class FindUserDTO {
  @ApiProperty({
    example: 'user-42',
    description: 'User unique identifier.',
  })
  uid: string;

  @ApiProperty({
    example: 'amaury',
    description: 'Public username.',
  })
  username: string;

  constructor(uid: string, username: string) {
    this.uid =uid;
    this.username = username;
  }
}