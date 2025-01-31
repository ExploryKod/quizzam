import { Test, TestingModule } from '@nestjs/testing';
import { PingController } from './ping.controller';

describe('PingController', () => {
  let controller: PingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
    }).compile();

    controller = module.get<PingController>(PingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return pong with version info if database is running', async () => {
    const result = await controller.ping();
    expect(result).toBeDefined();
    expect(result.response).toBe('pong');
    expect(result.version).toBeDefined();
    expect(result.version.status).toBe('OK');
    expect(result.version.details).toBeDefined();
    expect(result.version.details.database).toContain(`Database running - version 2`);
  });

  it('should return pong with KO as database details if database is not running', async () => {
    const result = await controller.ping();
    expect(result).toBeDefined();
    expect(result.response).toBe('pong');
    expect(result.version).toBeDefined();
    expect(result.version.status).toBe('Partial');
    expect(result.version.details).toBeDefined();
    expect(result.version.details.database).toContain(`Database KO`);
  });

});


