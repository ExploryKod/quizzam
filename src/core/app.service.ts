import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomTexts(): { title: string, description: string } {
    return ({
      title: 'Bienvenue sur l\'API Quizzy',
      description: 'Professeurs, créez vos quiz avec cette api sur-mesure. Swagger est utilisé pour la documentation des routes.'
    });

  }
  getBtnTexts(): { docs: string } {
    return ({
      docs: 'Consulter les docs (swagger)'
    });
  }
}
