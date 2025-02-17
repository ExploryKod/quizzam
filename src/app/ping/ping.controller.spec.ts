import { Test, TestingModule } from '@nestjs/testing';
import { PingController } from './ping.controller';
import { VersionRepositoryService } from './version-repository.service';

describe('PingController', () => {
  let controller: PingController;
  let versionService: VersionRepositoryService;

  beforeEach(async () => {
    const mockVersionService = {
      getVersion: jest.fn(), 
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
      providers: [{ provide: VersionRepositoryService, useValue: mockVersionService }],
    }).compile();

    controller = module.get<PingController>(PingController);
    versionService = module.get<VersionRepositoryService>(VersionRepositoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(versionService).toBeDefined();
  });

  it('should return pong with version info if database is running', async () => {
    (versionService.getVersion as jest.Mock).mockResolvedValue({
      status: 'OK',
      details: { database: 'Database running - version 2' },
    });

    const result = await controller.ping();
    console.log('Résultat du test (database running) :', result);
    expect(result).toBeDefined();
    expect(result.response).toBe('pong');
    expect(result.version).toBeDefined();
    expect(result.version.status).toBe('OK');
    expect(result.version.details).toBeDefined();
    expect(result.version.details.database).toContain(`Database running - version 2`);
  });

  it('should return pong with KO as database details if database is not running', async () => {
    (versionService.getVersion as jest.Mock).mockResolvedValue({
      status: 'Partial',
      details: { database: 'Database KO' },
    });

    const result = await controller.ping();
    console.log('Résultat du test (database KO) :', result);
    expect(result).toBeDefined();
    expect(result.response).toBe('pong');
    expect(result.version).toBeDefined();
    expect(result.version.status).toBe('Partial');
    expect(result.version.details).toBeDefined();
    expect(result.version.details.database).toContain(`Database KO`);
  });

});


