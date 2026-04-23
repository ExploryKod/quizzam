import { IUserRepository } from '../../ports/user-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
import { HttpException, HttpStatus } from '@nestjs/common';

export class FirebaseUserRepository implements IUserRepository {

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async addUsername(user: CreateUserProfilePayload): Promise<void> {

    const { username, uid } = user;
    const userRef = this.firebase.firestore.collection('users').doc(uid);

    await userRef.set({
      username,
    });
  }


  async findById(userId: string): Promise<UserRecord | null> {

    const userRef = this.firebase.firestore
      .collection('users')
      .doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    const userData = userDoc.data();

    return { uid: userData.uid, username: userData.username };
  }

}