# Documentation du Système WebSocket - Quizzam

## Vue d'ensemble

Le système WebSocket de Quizzam est responsable de la communication en temps réel entre l'hôte du quiz et les participants. Il utilise Socket.IO pour établir des connexions bidirectionnelles persistantes, permettant une expérience interactive fluide pendant les sessions de quiz.

## Architecture

Le système est composé de deux composants principaux :

1. **QuizGateway** : Gère les connexions WebSocket et les événements
2. **QuizExecutionService** : Contient la logique métier et gère l'état des exécutions de quiz

### Diagramme de flux

```
┌─────────┐       ┌─────────────┐       ┌───────────────────┐
│ Client  │◄─────►│ QuizGateway │◄─────►│QuizExecutionService│
└─────────┘       └─────────────┘       └───────────────────┘
                                                 ▲
                                                 │
                                          ┌──────┴──────┐
                                          │  Firebase   │
                                          └─────────────┘
```

## Événements WebSocket

### Événements Entrants (du client vers le serveur)

| Événement      | Description                                         | Payload                   |
| -------------- | --------------------------------------------------- | ------------------------- |
| `host`         | Connecte un hôte à une exécution de quiz spécifique | `{ executionId: string }` |
| `join`         | Permet à un participant de rejoindre un quiz        | `{ executionId: string }` |
| `nextQuestion` | Demande de passer à la question suivante            | `{ executionId: string }` |

### Événements Sortants (du serveur vers le client)

| Événement     | Description                                          | Payload                                                 |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `hostDetails` | Envoyé à l'hôte avec les détails du quiz             | `{ quiz: QuizData }`                                    |
| `joinDetails` | Envoyé aux participants avec les détails basiques    | `{ quizTitle: string }`                                 |
| `status`      | Informe tous les clients du statut actuel            | `{ status: 'waiting'/'started', participants: number }` |
| `newQuestion` | Envoie une nouvelle question à tous les participants | `{ question: string, answers: string[] }`               |
| `error`       | Notification d'erreur                                | `{ message: string }`                                   |

## Cycle de vie d'un quiz

1. **Initialisation** :

   - L'hôte se connecte via l'événement `host` avec un `executionId`
   - L'hôte reçoit les détails du quiz via `hostDetails`
   - Tous les participants connectés reçoivent le statut initial (`waiting`) via `status`

2. **Participation** :

   - Les participants rejoignent via l'événement `join` avec le même `executionId`
   - Chaque participant reçoit le titre du quiz via `joinDetails`
   - Le statut est mis à jour pour tous les participants via `status`

3. **Déroulement du quiz** :

   - L'hôte déclenche l'envoi des questions via l'événement `nextQuestion`
   - Le statut passe à `started` et est diffusé à tous via `status`
   - La question et les réponses possibles sont envoyées à tous via `newQuestion`
   - Ce processus se répète pour chaque question

4. **Fin du quiz** :
   - Après la dernière question, une question de conclusion "Fin du quiz" est envoyée
   - Toute tentative suivante de passer à la question suivante échouera

## Gestion des erreurs

En cas d'erreur (tentative d'action non autorisée, quiz inexistant, etc.), un événement `error` est émis au client concerné avec un message explicatif.

## Notes d'implémentation

- Le système utilise Firebase Firestore pour stocker et récupérer les données des quiz.
- La gestion de l'état est entièrement en mémoire via des Maps JavaScript.
- Plusieurs quiz peuvent être exécutés simultanément grâce à la séparation par `executionId`.
- Les participants sont regroupés dans des "rooms" Socket.IO correspondant à leur `executionId`.
- Le service est conçu pour être robuste face aux connexions/déconnexions des clients.

## Exemple d'utilisation

```typescript
// Côté client (exemple simplifié)
const socket = io('http://server-url');

// Pour l'hôte
socket.emit('host', { executionId: 'quiz-123' });
socket.on('hostDetails', (data) => console.log('Quiz details:', data));

// Pour un participant
socket.emit('join', { executionId: 'quiz-123' });
socket.on('joinDetails', (data) => console.log('Joined quiz:', data.quizTitle));

// Pour tous
socket.on('status', (data) => console.log('Quiz status:', data.status));
socket.on('newQuestion', (data) => console.log('New question:', data.question));
```
