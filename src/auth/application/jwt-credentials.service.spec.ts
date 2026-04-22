import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtCredentialsService } from './jwt-credentials.service';
import { JwtInMemoryRegistry } from '../infra/jwt-in-memory-registry';
import { variables } from '../../shared/variables.config';

describe('JwtCredentialsService', () => {
  let service: JwtCredentialsService;
  let registry: JwtInMemoryRegistry;
  let originalDatabase: string;
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    registry = new JwtInMemoryRegistry();
    service = new JwtCredentialsService(registry);
    originalDatabase = variables.database;
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';
    (variables as { database: string }).database = 'IN-MEMORY';
  });

  afterEach(() => {
    (variables as { database: string }).database = originalDatabase;
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('should register and return token/user in IN-MEMORY mode', async () => {
    const response = await service.register({
      username: 'test-user',
      email: 'test@example.com',
      password: 'password',
    });

    expect(response.token).toBeDefined();
    expect(response.user.email).toBe('test@example.com');
    expect(response.user.username).toBe('test-user');
    expect(response.user.uid).toBeDefined();
  });

  it('should fail when registering an existing email in IN-MEMORY mode', async () => {
    await service.register({
      username: 'test-user',
      email: 'test@example.com',
      password: 'password',
    });

    await expect(
      service.register({
        username: 'test-user-2',
        email: 'test@example.com',
        password: 'password-2',
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should login with valid credentials in IN-MEMORY mode', async () => {
    await service.register({
      username: 'test-user',
      email: 'test@example.com',
      password: 'password',
    });

    const response = await service.login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(response.token).toBeDefined();
    expect(response.user.email).toBe('test@example.com');
    expect(response.user.username).toBe('test-user');
  });

  it('should reject login with invalid credentials in IN-MEMORY mode', async () => {
    await service.register({
      username: 'test-user',
      email: 'test@example.com',
      password: 'password',
    });

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'wrong-password',
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should reject register when credentials are missing', async () => {
    await expect(
      service.register({
        username: '',
        email: '',
        password: '',
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should fail in unsupported database mode', async () => {
    (variables as { database: string }).database = 'FIREBASE';

    await expect(
      service.register({
        username: 'test-user',
        email: 'test@example.com',
        password: 'password',
      })
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
