import { ApiProperty } from '@nestjs/swagger';

/**
 * Default JSON body for most Nest `HttpException`s (exception filter, non–class-validator `BadRequest` uses the same keys).
 * Registered in OpenAPI `extraModels` for shared reference across operations.
 */
export class HttpExceptionBodyDto {
  @ApiProperty({ example: 404, description: 'HTTP status code.' })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or list of messages.',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: 'Not Found' })
  error: string;
}
