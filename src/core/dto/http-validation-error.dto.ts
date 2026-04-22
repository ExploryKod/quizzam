import { ApiBadRequestResponse, ApiProperty } from '@nestjs/swagger';

/**
 * Default JSON body for HTTP 400 with Nest’s `ValidationPipe` (class-validator) or
 * `BadRequestException` / `new BadRequestException('…')` — same `statusCode` / `message` / `error` shape.
 */
export class HttpValidationErrorDto {
  @ApiProperty({ example: 400, description: 'HTTP status code.' })
  statusCode: number;

  @ApiProperty({
    description:
      'Single message or list of class-validator / pipe messages (e.g. several fields invalid).',
    oneOf: [
      { type: 'string', example: 'email must be an email' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['title must be a string', 'email must be an email'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

/**
 * OpenAPI: documents a 400 with the default Nest bad-request/validation body (`HttpValidationErrorDto`).
 * Use for endpoints whose inputs are validated with `class-validator` or that throw `BadRequestException`.
 */
export const ApiValidationBadRequest = (detail: string) =>
  ApiBadRequestResponse({
    description: `${detail} Response body matches ${HttpValidationErrorDto.name} (Nest default).`,
    type: HttpValidationErrorDto,
  });
