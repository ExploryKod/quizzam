import { IUserRepository } from '../../ports/user-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { CreateUserDto } from '../../dto/user.dto';

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
}