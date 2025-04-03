import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Render('index')
  getHomePage() {
    return {
      title: this.appService.getWelcomTexts().title,
      description: this.appService.getWelcomTexts().description,
      btnText: this.appService.getBtnTexts().docs,
    };
  }
}
