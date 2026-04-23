import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiHttpInternalServerError,
  ApiHttpUnauthorized,
} from '../../core/dto/api-http-responses';
import { ApiValidationBadRequest } from '../../core/dto/http-validation-error.dto';
import { RequestWithUser } from '../../auth/model/request-with-user';
import { Auth } from '../../auth/auth.decorator';

import { AddUsername } from '../commands/add-username';
import {
  CreateUserProfileBodyDto,
  UserProfileResponseDto,
} from '../dto/user.dto';
import { GetUserByIdQuery } from '../queries/get-user-by-id';
import { DecodedToken } from '../../quiz/payloads';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly addUsername: AddUsername,
    private readonly getUserByIdQuery: GetUserByIdQuery
  ) {}

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Create or complete current user profile',
    description: 'Sets profile data for the authenticated user.',
  })
  @ApiBody({ type: CreateUserProfileBodyDto })
  @ApiOkResponse({ description: 'User profile created/updated.', schema: { example: null } })
  @ApiValidationBadRequest('Request body does not pass validation (username).')
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected server error while creating profile.')
  async create(
    @Req() request: RequestWithUser,
    @Body() body: CreateUserProfileBodyDto
  ) {

    const decodedToken: DecodedToken = await this.generateDecodedToken(request);

    try {
      const data = {
        uid: decodedToken.user_id,
        username: body.username,
      };

      await this.addUsername.execute(data);
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  @Get('me')
  @Auth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns current authenticated user details.',
  })
  @ApiOkResponse({
    description: 'User profile returned.',
    type: UserProfileResponseDto,
  })
  @ApiHttpUnauthorized('Missing or invalid bearer token.')
  @ApiHttpInternalServerError('Unexpected server error while loading profile.')
  async getCurrentUser(
    @Req() request: RequestWithUser
  ): Promise<UserProfileResponseDto> {
    const decodedToken: DecodedToken = await this.generateDecodedToken(request);

    try {
      const record = await this.getUserByIdQuery.execute(decodedToken.user_id);
      return plainToInstance(UserProfileResponseDto, record, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  private async generateDecodedToken(
    request: RequestWithUser
  ): Promise<DecodedToken> {
    const token = request.headers.authorization.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token) as DecodedToken | null;

    if (!decodedToken?.user_id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    return decodedToken;
  }

}
