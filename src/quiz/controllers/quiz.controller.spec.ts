import { Test, TestingModule } from '@nestjs/testing';
import { OldquizController } from './oldquiz.controller';


describe('QuizController', () => {
  let controller: OldquizController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OldquizController],
    }).compile();

    controller = module.get<OldquizController>(OldquizController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
