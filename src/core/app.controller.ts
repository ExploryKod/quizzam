import { Controller, Get, Render } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Render('index')
  @ApiOperation({
    summary: 'Render API landing page',
    description: 'Returns the server-rendered home page used as an API entry point.',
  })
  @ApiOkResponse({
    description: 'HTML landing page returned.',
    content: {
      'text/html': {
        schema: {
          type: 'string',
          example: '<!doctype html><html><head><title>Quizzam API</title></head><body>...</body></html>',
        },
      },
    },
  })
  getHomePage() {
    return {
      title: this.appService.getWelcomTexts().title,
      description: this.appService.getWelcomTexts().description,
      btnText: this.appService.getBtnTexts().docs,
    };
  }
}
