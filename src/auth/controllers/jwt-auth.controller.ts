import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtCredentialsService } from '../application/jwt-credentials.service';
import {
  JwtAuthResponseDto,
  JwtLoginRequestDto,
  JwtRegisterRequestDto,
} from '../dto/jwt-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class JwtAuthController {
  constructor(private readonly jwtCredentials: JwtCredentialsService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register with JWT credentials',
    description: 'Creates a new user account and returns an access token.',
  })
  @ApiBody({ type: JwtRegisterRequestDto })
  @ApiOkResponse({ description: 'Registration succeeded.', type: JwtAuthResponseDto })
  @ApiConflictResponse({ description: 'Email already registered.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid credentials payload.' })
  @ApiInternalServerErrorResponse({ description: 'JWT auth is unavailable for current backend mode.' })
  register(
    @Body()
    body: JwtRegisterRequestDto
  ) {
    return this.jwtCredentials.register(body);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with JWT credentials',
    description: 'Authenticates user credentials and returns an access token.',
  })
  @ApiBody({ type: JwtLoginRequestDto })
  @ApiOkResponse({ description: 'Authentication succeeded.', type: JwtAuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiInternalServerErrorResponse({ description: 'JWT auth is unavailable for current backend mode.' })
  login(
    @Body()
    body: JwtLoginRequestDto
  ) {
    return this.jwtCredentials.login(body);
  }
}
