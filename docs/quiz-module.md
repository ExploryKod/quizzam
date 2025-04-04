# Module Quiz - Documentation

## Vue d'ensemble

Le module Quiz est responsable de la gestion des quiz dans l'application Quizzam. Il permet la création, la consultation, la modification et l'exécution des quiz. Ce module implémente une architecture hexagonale (ports et adaptateurs) avec une séparation claire des responsabilités.

## Structure du module

```
src/app/quiz/
├── controllers/          # Gestion des requêtes HTTP
│   └── quiz.controller.ts
├── dto/                  # Objets de transfert de données pour la validation
│   └── quiz.dto.ts
├── errors/               # Classes d'erreur spécifiques au domaine
│   └── quiz-errors.ts
├── infra/                # Implémentations concrètes (adaptateurs)
│   └── firebase-quiz.repository.ts
├── interfaces/           # Modèles de domaine
│   └── quiz.interface.ts
├── mappers/              # Conversion entre différentes représentations
│   └── quiz.mapper.ts
├── ports/                # Interfaces pour les adaptateurs
│   └── quiz.repository.ts
├── services/             # Logique métier
│   └── quiz.service.ts
├── index.ts              # Point d'entrée du module
└── quiz.module.ts        # Configuration du module NestJS
```

## Composants principaux

### 1. Contrôleur (QuizController)

Le contrôleur expose les endpoints REST pour gérer les quiz :

- `GET /quiz` : Récupérer tous les quiz de l'utilisateur
- `POST /quiz` : Créer un nouveau quiz
- `GET /quiz/:id` : Récupérer un quiz par son ID
- `PATCH /quiz/:id` : Mettre à jour un quiz
- `POST /quiz/:id/questions` : Ajouter une question à un quiz
- `PUT /quiz/:id/questions/:questionId` : Mettre à jour une question
- `POST /quiz/:id/start` : Démarrer l'exécution d'un quiz

Le contrôleur utilise l'authentification et des DTOs pour valider les données entrantes.

### 2. Service (QuizService)

Le service encapsule la logique métier du module :

- Validation des règles métier
- Orchestration des opérations
- Gestion des erreurs spécifiques
- Journalisation des actions

Le service ne dépend pas directement de l'implémentation du repository, mais de son interface.

### 3. Repository

#### Interface (QuizRepository)

Définit les contrats d'accès aux données :

- `getUserQuizzes` : Récupérer les quiz d'un utilisateur
- `createQuiz` : Créer un nouveau quiz
- `getQuizById` : Récupérer un quiz par son ID
- `updateQuiz` : Mettre à jour un quiz
- `addQuestion` : Ajouter une question
- `updateQuestion` : Mettre à jour une question
- `createExecution` : Créer une exécution de quiz

#### Implémentation (FirebaseQuizRepository)

Implémente l'interface du repository en utilisant Firebase Firestore comme source de données.

### 4. Modèles de domaine

Les interfaces définissent la structure des données du domaine :

- `IQuiz` : Représente un quiz avec ses questions
- `IQuestion` : Représente une question avec ses réponses
- `IAnswer` : Représente une réponse à une question

### 5. DTOs (Data Transfer Objects)

Les DTOs servent à la validation des données entrantes :

- `CreateQuizDto` : Pour la création d'un quiz
- `PatchOperationDto` : Pour les mises à jour partielles
- `CreateQuestionDto` : Pour la création de questions
- `UpdateQuestionDto` : Pour la mise à jour de questions
- `AnswerDto` : Pour les réponses

### 6. Mappers

Les mappers assurent la conversion entre différentes représentations des données :

- `QuizMapper` : Conversion pour les quiz
- `QuestionMapper` : Conversion pour les questions
- `AnswerMapper` : Conversion pour les réponses

Chaque mapper implémente trois types de méthodes principales :

- `toEntity` : Conversion de données brutes vers le modèle de domaine
- `fromDto` : Conversion de DTO vers le modèle de domaine
- `toPersistence` : Conversion du modèle de domaine vers le format de stockage

### 7. Erreurs spécifiques

Des classes d'erreur spécifiques au domaine :

- `QuizNotFoundError` : Quiz non trouvé
- `QuestionNotFoundError` : Question non trouvée
- `UnauthorizedQuizAccessError` : Accès non autorisé
- `QuizNotStartableError` : Quiz ne pouvant pas démarrer

## Flux d'exécution typique

1. Le contrôleur reçoit une requête HTTP
2. Les DTOs valident les données entrantes
3. Le contrôleur appelle le service approprié
4. Le service utilise le repository pour accéder aux données
5. Les mappers convertissent les données entre les différentes couches
6. Le service applique la logique métier et gère les erreurs
7. Le contrôleur retourne la réponse HTTP appropriée

## Avantages de cette architecture

1. **Séparation des préoccupations** : Chaque composant a une responsabilité unique et claire
2. **Testabilité** : Facilité à tester chaque composant de manière isolée
3. **Flexibilité** : Facilité à remplacer une implémentation (ex: changer la base de données)
4. **Maintenabilité** : Code organisé, facile à comprendre et à faire évoluer
5. **Robustesse** : Meilleure gestion des erreurs et validation des données

## Intégration avec d'autres modules

Le module Quiz interagit avec :

- **Module d'authentification** : Pour vérifier l'identité des utilisateurs
- **Module WebSocket** : Pour l'exécution en temps réel des quiz
- **Firebase** : Pour la persistance des données

## Exemple d'utilisation

```typescript
// Depuis un autre module
import { QuizService } from '../quiz/services/quiz.service';

@Injectable()
export class AnotherService {
  constructor(private readonly quizService: QuizService) {}

  async someMethod() {
    // Récupérer les quiz d'un utilisateur
    const quizzes = await this.quizService.getUserQuizzes('userId');

    // Créer un nouveau quiz
    const quizId = await this.quizService.createQuiz(
      {
        title: 'Mon Quiz',
        description: 'Description du quiz',
      },
      'userId'
    );

    // Ajouter une question
    await this.quizService.addQuestion(quizId, 'userId', {
      title: 'Question 1',
      answers: [
        { title: 'Réponse 1', isCorrect: true },
        { title: 'Réponse 2', isCorrect: false },
      ],
    });
  }
}
```
