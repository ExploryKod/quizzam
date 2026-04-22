import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequestWithUser } from '../../auth/model/request-with-user';
import { Auth } from '../../auth/auth.decorator';

import { AddUsername } from '../commands/add-username';
import { CreateUserDto, FindUserDTO } from '../dto/user.dto';
import { GetUserByIdQuery } from '../queries/get-user-by-id';
import { DecodedToken } from '../../quiz/dto/quiz.dto';

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
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ description: 'User profile created/updated.', schema: { example: null } })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error while creating profile.' })
  async create(
    @Req() request: RequestWithUser,
    @Body() createUserDto: CreateUserDto
  ) {

    const decodedToken: DecodedToken = await this.generateDecodedToken(request);

    try {
      const data = {
        uid: decodedToken.user_id,
        username: createUserDto.username,
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
  @ApiOkResponse({ description: 'User profile returned.', type: FindUserDTO })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected server error while loading profile.' })
  async getCurrentUser(@Req() request: RequestWithUser): Promise<FindUserDTO> {

    const decodedToken: DecodedToken = await this.generateDecodedToken(request);

    try {
      return await this.getUserByIdQuery.execute(decodedToken.user_id);
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  private async generateDecodedToken(request:  RequestWithUser) {
    const token = request.headers.authorization.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token);

    if (!decodedToken.user_id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    return decodedToken;
  }

}
