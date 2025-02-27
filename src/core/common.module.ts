import { Module } from '@nestjs/common';
import { RandomIDGenerator } from './adapters/random-id-generator';
import { AppService } from './app.service';
import { I_ID_GENERATOR } from './ports/id-generator.interface';

@Module({
  imports: [],
  controllers: [],
  providers: [
    AppService,
    {
      provide: I_ID_GENERATOR,
      useClass: RandomIDGenerator,
    },
  ],
  exports: [I_ID_GENERATOR],
})
export class CommonModule {}
