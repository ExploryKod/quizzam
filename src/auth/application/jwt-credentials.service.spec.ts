import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtCredentialsService } from './jwt-credentials.service';
import { JwtInMemoryRegistry } from '../infra/jwt-in-memory-registry';
import { variables } from '../../shared/variables.config';
import { hashPassword } from '../infra/password.util';

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

  describe('MONGODB mode', () => {
    const buildMongoModel = () => ({
      findOne: jest.fn(),
      create: jest.fn(),
    });

    it('should register and persist user in MONGODB mode', async () => {
      const userModel = buildMongoModel();
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(undefined);
      (variables as { database: string }).database = 'MONGODB';
      service = new JwtCredentialsService(registry, userModel as any);

      const response = await service.register({
        username: 'mongo-user',
        email: 'mongo@example.com',
        password: 'password',
      });

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'mongo@example.com' });
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'mongo-user',
          email: 'mongo@example.com',
          _id: expect.any(String),
          passwordHash: expect.any(String),
        })
      );
      expect(response.token).toBeDefined();
      expect(response.user).toEqual(
        expect.objectContaining({
          email: 'mongo@example.com',
          username: 'mongo-user',
          uid: expect.any(String),
        })
      );
    });

    it('should fail register when email already exists in MONGODB mode', async () => {
      const userModel = buildMongoModel();
      userModel.findOne.mockResolvedValue({ _id: 'existing' });
      (variables as { database: string }).database = 'MONGODB';
      service = new JwtCredentialsService(registry, userModel as any);

      await expect(
        service.register({
          username: 'mongo-user',
          email: 'mongo@example.com',
          password: 'password',
        })
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should map duplicate key error to conflict in MONGODB mode', async () => {
      const userModel = buildMongoModel();
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockRejectedValue({ code: 11000 });
      (variables as { database: string }).database = 'MONGODB';
      service = new JwtCredentialsService(registry, userModel as any);

      await expect(
        service.register({
          username: 'mongo-user',
          email: 'mongo@example.com',
          password: 'password',
        })
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should login with valid credentials in MONGODB mode', async () => {
      const userModel = buildMongoModel();
      const passwordHash = await hashPassword('password');
      userModel.findOne.mockResolvedValue({
        _id: 'mongo-uid',
        email: 'mongo@example.com',
        username: 'mongo-user',
        passwordHash,
      });
      (variables as { database: string }).database = 'MONGODB';
      service = new JwtCredentialsService(registry, userModel as any);

      const response = await service.login({
        email: 'mongo@example.com',
        password: 'password',
      });

      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'mongo@example.com' });
      expect(response.user).toEqual({
        email: 'mongo@example.com',
        uid: 'mongo-uid',
        username: 'mongo-user',
      });
      expect(response.token).toBeDefined();
    });

    it('should reject login with invalid credentials in MONGODB mode', async () => {
      const userModel = buildMongoModel();
      userModel.findOne.mockResolvedValue(null);
      (variables as { database: string }).database = 'MONGODB';
      service = new JwtCredentialsService(registry, userModel as any);

      await expect(
        service.login({
          email: 'mongo@example.com',
          password: 'password',
        })
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should fail when mongo model is missing in MONGODB mode', async () => {
      (variables as { database: string }).database = 'MONGODB';
      service = new JwtCredentialsService(registry);

      await expect(
        service.register({
          username: 'mongo-user',
          email: 'mongo@example.com',
          password: 'password',
        })
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
