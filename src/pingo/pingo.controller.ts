import { Controller, Get, HttpStatus } from '@nestjs/common';
console.log('ping controller d ');
@Controller('pingo')
export class PingoController {
  @Get()
  getPingo(): {message: string, status: HttpStatus} {
    return {message: 'Pongo', status: HttpStatus.OK};
  }
}