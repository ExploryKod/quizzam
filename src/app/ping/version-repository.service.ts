import { Injectable } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { ApiProperty } from '@nestjs/swagger';

type DatabaseStatus = {
  database: string;
}

type Ping = {
  status: string;
  details: DatabaseStatus;
}

@Injectable()
export class VersionRepositoryService {
  constructor(@InjectFirebaseAdmin() private readonly fa: FirebaseAdmin) {}

  async getVersion(): Promise<Ping> {
    const versionsCollection = this.fa.firestore.collection('versions');
    const versions = (await versionsCollection.get()).docs;
    const version = versions[0].data();
    return {status : version.version ? "OK" : "Partial", details : { database: version.version ? `Database running - version ${version.version}` : "Database KO" }};
  }
}
