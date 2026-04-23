import { ApiProperty } from '@nestjs/swagger';

export class PingDetailsDto {
  @ApiProperty({
    example: 'OK',
    description: 'Database health status.',
  })
  database: string;
}

export class PingResponseDto {
  @ApiProperty({
    example: 'OK',
    description: 'Global API health status.',
  })
  status: string;

  @ApiProperty({ type: () => PingDetailsDto })
  details: PingDetailsDto;
}
