import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpExceptionBodyDto } from './http-exception-body.dto';

const nestBody = (what: string) =>
  `${what} Response body: \`${HttpExceptionBodyDto.name}\` (typical Nest \`statusCode\`, \`message\`, \`error\`).`;

export const ApiHttpUnauthorized = (detail: string) =>
  ApiUnauthorizedResponse({
    description: nestBody(detail),
    type: HttpExceptionBodyDto,
  });

export const ApiHttpNotFound = (detail: string) =>
  ApiNotFoundResponse({
    description: nestBody(detail),
    type: HttpExceptionBodyDto,
  });

export const ApiHttpForbidden = (detail: string) =>
  ApiForbiddenResponse({
    description: nestBody(detail),
    type: HttpExceptionBodyDto,
  });

export const ApiHttpConflict = (detail: string) =>
  ApiConflictResponse({
    description: nestBody(detail),
    type: HttpExceptionBodyDto,
  });

export const ApiHttpInternalServerError = (detail: string) =>
  ApiInternalServerErrorResponse({
    description: nestBody(detail),
    type: HttpExceptionBodyDto,
  });
