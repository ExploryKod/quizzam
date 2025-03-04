import { IPingRepository } from '../ping-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { DatabaseStatus, DatabaseVersion } from '../ping.entity';

export class FirebasePingRepository implements IPingRepository {
  constructor(
    @InjectFirebaseAdmin() private readonly fa: FirebaseAdmin
  ) {}

  async getDatabaseVersion(): Promise<DatabaseVersion> {

    const versionsCollection = this.fa.firestore.collection('versions');
    const versions = (await versionsCollection.get()).docs;
    const version = versions[0].data();

    return {
      version: version.version,
    };
  }

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      await this.fa.firestore.collection('versions').limit(1).get();
      return {
        status: "OK"
      };
    } catch (error) {
      console.error('Firebase database connection error:', error);
      return {
         status: "KO"
      };
    }
  }
}
