import {
  Controller,
  Post,
  Req,
  Get,
  HttpStatus,
  HttpException,
  Body,
} from '@nestjs/common';
import { RequestWithUser } from '../../auth/model/request-with-user';
import { Auth } from '../../auth/auth.decorator';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { JwtPayload } from 'jsonwebtoken';

import { AddUsername } from '../commands/add-username';
import { ZodValidationPipe } from '../../core/pipes/zod-validation.pipe';
import { userAPI } from '../contract';
import { CreateUserDto} from '../dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    private readonly addUsername: AddUsername,
  ) {}

  // Need to know the link here with createUserDTO that was previously linked to body
  // @Post()
  // @Auth()
  // async create(
  //   @Req() request: RequestWithUser,
  //   @Body(new ZodValidationPipe(userAPI.addUsername.schema))
  //   body: userAPI.addUsername.Request,
  // ): Promise<userAPI.addUsername.Response> {
  //
  //   const token = request.headers.authorization.split('Bearer ')[1];
  //   const jwt = require('jsonwebtoken');
  //   const decodedToken = jwt.decode(token);
  //
  //   const uid = decodedToken.user_id;
  //
  //   return this.addUsername.execute({
  //     uid: uid,
  //     username: body.username
  //   });
  // }

  @Post()
  @Auth()
  async create(
    @Req() request: RequestWithUser,
    @Body() CreateUserDto: CreateUserDto
  ) {
    const { username } = CreateUserDto;
    const token = request.headers.authorization.split('Bearer ')[1];

    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token);

    const uid = decodedToken.user_id;

    try {

      const userRef = this.firebase.firestore.collection('users').doc(uid);

      await userRef.set({
        username,
      });
      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  @Get('me')
  @Auth()
  async getCurrentUser(@Req() request: RequestWithUser) {
    const token = request.headers.authorization.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token) as JwtPayload;

    if (!decodedToken.user_id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const userRef = this.firebase.firestore
        .collection('users')
        .doc(decodedToken.user_id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      const userData = userDoc.data();
      return {
        uid: decodedToken.user_id,
        username: userData.username,
        email: decodedToken.email,
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }
}
