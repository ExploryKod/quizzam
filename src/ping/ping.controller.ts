import { Controller, Get, HttpStatus } from '@nestjs/common';
console.log('ping controller d ');
@Controller('ping')
export class PingController {
  @Get()
  getPing(): {message: string, status: HttpStatus} {
    return {message: 'Pong', status: HttpStatus.OK};
  }
}