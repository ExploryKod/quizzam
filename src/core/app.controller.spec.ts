import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getWelcomTexts: jest.fn(),
            getBtnTexts: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    appService = module.get(AppService);
  });

  it('should return landing page model from AppService', () => {
    appService.getWelcomTexts.mockReturnValue({
      title: 'Bienvenue',
      description: 'Description',
    });
    appService.getBtnTexts.mockReturnValue({
      docs: 'Docs',
    });

    const result = controller.getHomePage();

    expect(result).toEqual({
      title: 'Bienvenue',
      description: 'Description',
      btnText: 'Docs',
    });
  });
});
