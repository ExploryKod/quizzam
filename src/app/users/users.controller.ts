import { Controller, Post, Req } from '@nestjs/common';
import { RequestWithUser } from '../modules/auth/model/request-with-user';
import { Auth } from '../modules/auth/auth.decorator';

@Controller('users')
export class UsersController {


  @Post()
  @Auth()
  create(@Req() request: RequestWithUser) {
    const { username } = request.body;
    console.log("username", username);
    console.log("request token if auth result", request.user.uid);
  }


}



