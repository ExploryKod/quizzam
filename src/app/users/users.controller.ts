import { Controller, Post, Req, Get, HttpStatus, HttpException } from '@nestjs/common';
import { RequestWithUser } from '../modules/auth/model/request-with-user';
import { Auth } from '../modules/auth/auth.decorator';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';


@Controller('users')
export class UsersController {

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {
  }

  @Post()
  @Auth()
  async create(@Req() request: RequestWithUser) {
    const { username } = request.body;
    // étant donné qu'on a déjà le uid dans l'objet request.user, on peut directement l'utiliser
    const uid = request.user.uid;
    const email = request.user.email;
    console.log("user", request.user);
    console.log("body", request.body);
    console.log("headers", request.headers);
    try {
      const userRef = this.firebase.firestore.collection('users').doc(uid);

      await userRef.set({
        uid: request.user.uid.toString(),
        username,
        email: request.user.email,
      });

      return {
        status: HttpStatus.CREATED,
        message: 'User created successfully',
        data: {
          uid,
          username,
          email,
        }
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  @Get('me')
  @Auth()
  async getCurrentUser(@Req() request: RequestWithUser) {
    console.log("user request on connexion", request.user);
    if (!request.user?.uid) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      const userRef = this.firebase.firestore.collection('users').doc(request.user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      const userData = userDoc.data();
      console.log("USER DATA", userData);
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