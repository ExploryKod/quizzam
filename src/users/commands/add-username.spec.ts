import { AddUsername } from './add-username';
import { IUserRepository } from '../ports/user-repository.interface';

describe('AddUsername', () => {
  it('should map request data and call repository', async () => {
    const repository: jest.Mocked<IUserRepository> = {
      addUsername: jest.fn(),
      findById: jest.fn(),
    };
    const useCase = new AddUsername(repository);

    await useCase.execute({ uid: 'uid-1', username: 'test-user' });

    expect(repository.addUsername).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'uid-1',
        username: 'test-user',
      })
    );
  });
});
