# Documentation du système de validation des quiz

Le système de validation de l'application QuizzAM est conçu pour garantir l'intégrité des données tout en permettant une flexibilité dans la création et l'édition des quiz. Cette documentation explique les différentes étapes de validation et leur fonctionnement.

## Architecture de validation

Le système utilise deux couches de validation :

1. **Validation des DTO (Data Transfer Objects)** - Effectuée automatiquement par NestJS lors de la réception des requêtes
2. **Validation métier** - Implémentée dans le service `QuizService` et appliquée à des moments spécifiques

## Validation des DTO

La validation des DTO utilise la bibliothèque `class-validator` pour définir des contraintes sur les données entrantes.

### CreateQuizDto

```typescript
export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(500)
  description: string;
}
```

**Validations effectuées :**

- Le titre doit être une chaîne de caractères non vide entre 3 et 100 caractères
- La description doit être une chaîne de caractères de maximum 500 caractères

**Quand :** Lors de la création d'un quiz (POST `/quiz`)

### PatchOperationDto

```typescript
export class PatchOperationDto {
  @IsEnum(['replace'])
  op: 'replace';

  @IsEnum(['/title'])
  path: '/title';

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  value: string;
}
```

**Validations effectuées :**

- L'opération doit être 'replace'
- Le chemin doit être '/title'
- La valeur doit être une chaîne non vide entre 3 et 100 caractères

**Quand :** Lors de la mise à jour partielle d'un quiz (PATCH `/quiz/:id`)

### AnswerDto

```typescript
export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsBoolean()
  isCorrect: boolean;
}
```

**Validations effectuées :**

- Le titre doit être une chaîne non vide entre 1 et 200 caractères
- Le statut de correction doit être un booléen

**Quand :** Utilisé comme sous-composant de `CreateQuestionDto`

### CreateQuestionDto et UpdateQuestionDto

```typescript
export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
```

**Validations effectuées :**

- Le titre doit être une chaîne non vide entre 3 et 200 caractères
- Les réponses doivent être un tableau d'objets `AnswerDto` valides

**Quand :**

- Lors de l'ajout d'une question (POST `/quiz/:id/questions`)
- Lors de la mise à jour d'une question (PUT `/quiz/:quizId/questions/:questionId`)

## Validation métier dans le service

En plus de la validation des DTO, le `QuizService` effectue des validations supplémentaires au niveau métier.

### Validation au lancement du quiz

```typescript
async startQuiz(quizId: string, userId: string): Promise<string> {
  const quiz = await this.getQuizById(quizId, userId);

  if (!this.isQuizStartable(quiz.title, quiz.questions || [])) {
    throw new BadRequestException("Le quiz n'est pas prêt à être démarré");
  }

  // ...
}
```

**Quand :** Uniquement lors du lancement d'un quiz (POST `/quiz/:id/start`)

### Méthode isQuizStartable

```typescript
private isQuizStartable(title: string, questions: any[]): boolean {
  // Critère 1: Le titre ne doit pas être vide
  if (!title || title.trim() === '') {
    return false;
  }

  // Critère 2: Il doit y avoir au moins une question
  if (!questions || questions.length === 0) {
    return false;
  }

  // Critère 3: Toutes les questions doivent être valides
  return questions.every((question) => this.isQuestionValid(question));
}
```

**Validations effectuées :**

- Le titre du quiz ne doit pas être vide
- Le quiz doit contenir au moins une question
- Toutes les questions doivent être valides selon `isQuestionValid`

**Utilisée par :**

- `startQuiz()` pour vérifier si un quiz peut être lancé
- `getUserQuizzes()` pour déterminer la propriété `isStartable` de chaque quiz

### Méthode isQuestionValid

```typescript
private isQuestionValid(question: any): boolean {
  if (!question.title || question.title.trim() === '') {
    return false;
  }

  if (!question.answers || question.answers.length < 2) {
    return false;
  }

  const correctAnswersCount = question.answers.filter(
    (answer) => answer.isCorrect
  ).length;
  if (correctAnswersCount !== 1) {
    return false;
  }

  return true;
}
```

**Validations effectuées :**

- La question doit avoir un titre non vide
- La question doit avoir au moins 2 réponses
- La question doit avoir exactement une réponse correcte

**Utilisée par :** Uniquement par `isQuizStartable`

## Résumé des validations par étape

### Création de quiz

- Validation DTO : Titre (requis, 3-100 chars), Description (max 500 chars)
- Validation métier : Aucune

### Modification de quiz (titre)

- Validation DTO : Valeur (requis, 3-100 chars)
- Validation métier : Aucune

### Ajout d'une question

- Validation DTO : Titre (requis, 3-200 chars), Réponses (tableau de DTO valides)
- Validation métier : Aucune

### Modification d'une question

- Validation DTO : Comme pour l'ajout
- Validation métier : Aucune

### Lancement d'un quiz

- Validation DTO : Aucune
- Validation métier complète :
  - Quiz : Titre non vide, au moins une question
  - Questions : Titre non vide, au moins 2 réponses, exactement 1 réponse correcte

## Avantages de cette approche

1. **Flexibilité** : Permet de sauvegarder des quiz et questions incomplets pendant leur création
2. **Contrôle strict au lancement** : Garantit que seuls les quiz correctement construits peuvent être lancés
3. **Interface utilisateur adaptative** : L'API renvoie `isStartable` pour que l'interface utilisateur puisse adapter son comportement

Ce système de validation en deux couches offre un bon équilibre entre flexibilité et rigueur, en permettant un workflow de création progressif tout en garantissant l'intégrité des données lors de l'exécution des quiz.
