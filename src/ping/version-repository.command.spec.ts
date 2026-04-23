import { GetVersionCommand } from './version-repository.command';
import { IPingRepository } from './ping-repository.interface';

describe('GetVersionCommand', () => {
  it('should return API and database status payload', async () => {
    const repository: jest.Mocked<IPingRepository> = {
      getDatabaseStatus: jest.fn().mockResolvedValue({ status: 'OK' } as any),
      getDatabaseVersion: jest.fn().mockResolvedValue({ version: 'v2' }),
    };
    const command = new GetVersionCommand(repository);

    const result = await command.execute();

    expect(repository.getDatabaseStatus).toHaveBeenCalled();
    expect(repository.getDatabaseVersion).toHaveBeenCalled();
    expect(result).toEqual({
      status: 'OK',
      database: { version: 'v2', status: 'OK' },
    });
  });
});
