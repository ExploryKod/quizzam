# Documentation API (Quizzam)

> **Contexte refactor / alignement front–back** : voir [quizzy-front-renew-app/docs/refactor.md](../../quizzy-front-renew-app/docs/refactor.md) (section contrats quiz).

### Référence interactive

- **OpenAPI (Swagger UI)** : `{origine}/api/docs`  
  Exemple en local : `http://localhost:3000/api/docs` (port selon `PORT` dans `.env`), ou `http://localhost:3002/api/docs` si l’API tourne dans Docker avec le mappage hôte `QUIZZAM_HOST_PORT` (souvent **3002**).
- Préfixe HTTP des routes REST : **`GLOBAL_PREFIX`** (défaut `api`) — chemins du type `/api/...`.

### `GET /api/quiz/:id` — détail d’un quiz

**Authentification** : `Authorization: Bearer <token>` (propriétaire du quiz).

**Corps de réponse `200`** : objet **ressource complet** avec notamment :

| Champ | Rôle |
|--------|------|
| `id` | Identifiant du quiz (même valeur que le segment `:id` dans l’URL). Permet d’utiliser le JSON tel quel sans recopier l’id depuis la route (modèles typés, stockage, clés du type `quiz-score:${id}`, etc.). |
| `title` | Titre du quiz |
| `description` | Description |
| `questions` | Tableau de questions (chaque question a `id`, `title`, `answers` avec `title` et `isCorrect`) |

**Note** : la liste des quiz (`GET /api/quiz`) expose déjà un `id` par élément ; le détail aligne le même principe pour un objet cohérent avec le modèle client (ex. interface `Quiz` côté Angular).

Les **exemples** (« avec questions » / « sans questions ») sont visibles dans Swagger sur l’opération d’obtention d’un quiz par id.
