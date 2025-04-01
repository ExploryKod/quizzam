import { Module } from '@nestjs/common';
import { PingController } from './ping.controller';
import { GetVersionCommand} from './version-repository.command';
import { I_PING_REPOSITORY, IPingRepository } from './ping-repository.interface';
import { variables } from '../shared/variables.config';
import { MongoPingRepository } from './adapters/mongo-ping-repository';
import { FirebasePingRepository } from './adapters/firebase-ping-repository';
import { InMemoryPingRepository } from './adapters/in-memory-ping-repository';

@Module({
  controllers: [PingController],

  providers: [
    {
      provide: I_PING_REPOSITORY,
      useClass: (() => {
        switch (variables.database) {
          case 'MONGODB':
            return MongoPingRepository;
          case 'FIREBASE':
            return FirebasePingRepository;
          case 'IN-MEMORY':
            return InMemoryPingRepository;
          default:
            throw new Error(`Unsupported database: ${variables.database} - Please add it in module providers and shared variables`);
        }
      })(),
    },
    {
      provide: GetVersionCommand,
      inject: [
        I_PING_REPOSITORY,
      ],
      useFactory: (repository: IPingRepository) => {
        return new GetVersionCommand(repository);
      }
    },

  ],

})
export class PingModule {}
