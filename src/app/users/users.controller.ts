import {
  Controller,
  Post,
  Req,
  Get,
  HttpStatus,
  HttpException,
  Body,
} from '@nestjs/common';
import { RequestWithUser } from '../modules/auth/model/request-with-user';
import { Auth } from '../modules/auth/auth.decorator';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';

class CreateUserDto {
  username: string;
}
@Controller('users')
export class UsersController {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  @Post()
  @Auth()
  async create(
    @Req() request: RequestWithUser,
    @Body() CreateUserDto: CreateUserDto
  ) {
    const { username } = CreateUserDto;
    console.log('headers', request.headers);
    const token = request.headers.authorization.split('Bearer ')[1];
    console.log('token', token);

    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token);
    console.log('Decoded token:', decodedToken);

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
    console.log('user request on connexion', request.user);
    if (!request.user?.uid) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const userRef = this.firebase.firestore
        .collection('users')
        .doc(request.user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      const userData = userDoc.data();
      console.log('USER DATA', userData);
      return {
        uid: request.user.uid,
        username: userData.username,
        email: request.user.email,
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }
}
