import { IPingRepository } from '../ping-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { VersionResult } from '../ping.entity';

export class FirebasePingRepository implements IPingRepository {
  constructor(
    @InjectFirebaseAdmin() private readonly fa: FirebaseAdmin
  ) {}

  async getVersion(): Promise<VersionResult> {

    const versionsCollection = this.fa.firestore.collection('versions');
    const versions = (await versionsCollection.get()).docs;
    const version = versions[0].data();

    return {
      status : version.version ? "OK" : "Partial",
      details : { database: version.version ? `Database is running on version ${version.version}` : "Database KO" }
    };
  }
}
