import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddMessageDto {
  @ApiProperty({ example: 'Alice', description: 'Message author display name.' })
  @IsString()
  @MinLength(1)
  author: string;

  @ApiProperty({ example: 'Hello from chat', description: 'Message body text.' })
  @IsString()
  @MinLength(1)
  body: string;
}
