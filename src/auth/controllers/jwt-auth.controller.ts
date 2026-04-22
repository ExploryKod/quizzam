import { Body, Controller, Post } from '@nestjs/common';
import { JwtCredentialsService } from '../application/jwt-credentials.service';

@Controller('auth')
export class JwtAuthController {
  constructor(private readonly jwtCredentials: JwtCredentialsService) {}

  @Post('register')
  register(
    @Body()
    body: {
      username: string;
      email: string;
      password: string;
    }
  ) {
    return this.jwtCredentials.register(body);
  }

  @Post('login')
  login(
    @Body()
    body: {
      email: string;
      password: string;
    }
  ) {
    return this.jwtCredentials.login(body);
  }
}
