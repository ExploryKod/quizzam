import {
  Controller,
  Post,
  Req,
  Get,
  HttpStatus,
  HttpException,
  Body,
  HttpCode,
} from '@nestjs/common';
import { RequestWithUser } from '../modules/auth/model/request-with-user';
import { Auth } from '../modules/auth/auth.decorator';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { JwtPayload } from 'jsonwebtoken';
import { IsString, IsNotEmpty } from 'class-validator';
import * as jwt from 'jsonwebtoken';

class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}

@Controller('users')
export class UsersController {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  @Post()
  @Auth()
  @HttpCode(201)
  async create(
    @Req() request: RequestWithUser,
    @Body() createUserDto: CreateUserDto
  ) {
    try {
      const token = request.headers.authorization.split('Bearer ')[1];
      const decodedToken = jwt.decode(token) as JwtPayload;
      const uid = decodedToken.user_id;

      await this.firebase.firestore.collection('users').doc(uid).set({
        username: createUserDto.username,
      });

      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new HttpException(
        "Erreur lors de la création de l'utilisateur",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('me')
  @Auth()
  async getCurrentUser(@Req() request: RequestWithUser) {
    const token = request.headers.authorization.split('Bearer ')[1];
    const jwt = require('jsonwebtoken');
    const decodedToken = jwt.decode(token) as JwtPayload;
    console.log(decodedToken);

    if (!decodedToken.user_id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const userRef = this.firebase.firestore
        .collection('users')
        .doc(decodedToken.user_id);
      // console.log(userRef);
      const userDoc = await userRef.get();
      console.log(userDoc);

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
