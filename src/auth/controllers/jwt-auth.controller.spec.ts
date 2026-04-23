import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthController } from './jwt-auth.controller';
import { JwtCredentialsService } from '../application/jwt-credentials.service';
import { JwtLoginRequestDto, JwtRegisterRequestDto } from '../dto/jwt-auth.dto';

describe('JwtAuthController', () => {
  let controller: JwtAuthController;
  let jwtCredentialsService: jest.Mocked<JwtCredentialsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JwtAuthController],
      providers: [
        {
          provide: JwtCredentialsService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JwtAuthController>(JwtAuthController);
    jwtCredentialsService = module.get(JwtCredentialsService);
  });

  it('should delegate register to JwtCredentialsService', async () => {
    const payload: JwtRegisterRequestDto = {
      username: 'test-user',
      email: 'test@example.com',
      password: 'password',
    };
    const expected = {
      token: 'jwt-token',
      user: { email: payload.email, uid: 'uid-1', username: payload.username },
    };
    jwtCredentialsService.register.mockResolvedValue(expected);

    const result = await controller.register(payload);

    expect(jwtCredentialsService.register).toHaveBeenCalledWith(payload);
    expect(result).toEqual(expected);
  });

  it('should delegate login to JwtCredentialsService', async () => {
    const payload: JwtLoginRequestDto = {
      email: 'test@example.com',
      password: 'password',
    };
    const expected = {
      token: 'jwt-token',
      user: { email: payload.email, uid: 'uid-1', username: 'test-user' },
    };
    jwtCredentialsService.login.mockResolvedValue(expected);

    const result = await controller.login(payload);

    expect(jwtCredentialsService.login).toHaveBeenCalledWith(payload);
    expect(result).toEqual(expected);
  });
});
