import { Test, TestingModule } from '@nestjs/testing';
import { PingoController } from './pingo.controller';

describe('PingController', () => {
  let controller: PingoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingoController],
    }).compile();

    controller = module.get<PingoController>(PingoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
