import { IUserRepository } from '../../ports/user-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { CreateUserDto, FindUserDTO } from '../../dto/user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

export class FirebaseUserRepository implements IUserRepository {

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async addUsername(user: CreateUserDto): Promise<void> {

    const { username, uid } = user;
    const userRef = this.firebase.firestore.collection('users').doc(uid);

    await userRef.set({
      username,
    });
  }


  async findById(userId: string): Promise<FindUserDTO | null> {

    const userRef = this.firebase.firestore
      .collection('users')
      .doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    const userData = userDoc.data();

    return new FindUserDTO(userData.uid, userData.username);
  }

}