import { Test, TestingModule } from '@nestjs/testing';
import { PingController } from './ping.controller';
import { GetVersionCommand } from './version-repository.command';

describe('PingController', () => {
  let controller: PingController;
  let getVersionCommand: jest.Mocked<GetVersionCommand>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
      providers: [
        {
          provide: GetVersionCommand,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PingController>(PingController);
    getVersionCommand = module.get(GetVersionCommand);
  });

  it('should return ping payload from version command', async () => {
    getVersionCommand.execute.mockResolvedValue({
      status: 'OK',
      database: { version: 'v2', status: 'OK' },
    } as any);

    const result = await controller.ping();

    expect(getVersionCommand.execute).toHaveBeenCalled();
    expect(result).toEqual({
      status: 'OK',
      details: { database: 'OK' },
    });
  });
});
