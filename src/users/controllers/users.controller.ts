import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Optional,
  Inject,
} from '@nestjs/common';
import { RequestWithUser } from '../../auth/model/request-with-user';
import { Auth } from '../../auth/auth.decorator';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { JwtPayload } from 'jsonwebtoken';

import { AddUsername } from '../commands/add-username';
import { CreateUserDto, FindUserDTO } from '../dto/user.dto';
import { GetUserByIdQuery } from '../queries/get-user-by-id';
import { DecodedToken } from '../../quiz/dto/quiz.dto';

@Controller('users')
export class UsersController {
  constructor(
    @Optional() @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin | null,
    private readonly addUsername: AddUsername,
    private readonly getUserByIdQuery: GetUserByIdQuery
  ) {}

  @Post()
  @Auth()
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
  async getCurrentUser(@Req() request: RequestWithUser): Promise<FindUserDTO> {

    const decodedToken: DecodedToken = await this.generateDecodedToken(request);

    try {
      return await this.getUserByIdQuery.execute(decodedToken.user_id);
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  private async generateDecodedToken(request: RequestWithUser): Promise<DecodedToken> {
    // Use the user from request (set by auth middleware)
    if (request.user) {
      return {
        user_id: request.user.uid,
      };
    }

    // Fallback: decode token directly (for backward compatibility)
    const token = request.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token) as DecodedToken;

    if (!decodedToken || !decodedToken.user_id) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED
      );
    }

    return decodedToken;
  }

}
