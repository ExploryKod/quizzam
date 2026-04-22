import { NotFoundException } from '@nestjs/common';
import { GetUserByIdQuery } from './get-user-by-id';
import { IUserRepository } from '../ports/user-repository.interface';
import { FindUserDTO } from '../dto/user.dto';

describe('GetUserByIdQuery', () => {
  it('should return user when found', async () => {
    const user = new FindUserDTO('uid-1', 'test-user');
    const repository: jest.Mocked<IUserRepository> = {
      addUsername: jest.fn(),
      findById: jest.fn().mockResolvedValue(user),
    };
    const query = new GetUserByIdQuery(repository);

    const result = await query.execute('uid-1');

    expect(repository.findById).toHaveBeenCalledWith('uid-1');
    expect(result).toEqual(user);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    const repository: jest.Mocked<IUserRepository> = {
      addUsername: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
    };
    const query = new GetUserByIdQuery(repository);

    await expect(query.execute('missing-uid')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
