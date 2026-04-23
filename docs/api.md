# Documentation API (Quizzam)

> **Contexte refactor / alignement front–back** : voir [quizzy-front-renew-app/docs/refactor.md](../../quizzy-front-renew-app/docs/refactor.md) (section contrats quiz).

### Référence interactive

- **OpenAPI (Swagger UI)** : `{origine}/api/docs`  
  - **`nx serve`** sur l’hôte : en général `http://localhost:3000/api/docs` (selon `PORT` dans `quizzam/.env`).  
  - **Docker watch** (`./docker/start.sh watch-up`) : mappage hôte par défaut **`http://localhost:3002/api/docs`** (variable `QUIZZAM_HOST_PORT`, souvent 3002) — c’est l’URL la plus courante pour aligner DTOs / essais manuels pendant le dev conteneur.
- Préfixe HTTP des routes REST : **`GLOBAL_PREFIX`** (défaut `api`) — chemins du type `/api/...`.

### DTOs et validation d’entrée

- Côté Nest : **`ValidationPipe` global** + décorateurs **class-validator** sur les corps typés (auth, users, quiz). Le détail des règles (brouillons de questions vs remplacement strict, `PATCH` en tableau, etc.) est suivi dans [refactor.md](../../quizzy-front-renew-app/docs/refactor.md#refactoring-des-objets-dto) (*Journal (validation — frontière API)*).  
- Les types **internes** (payloads application / persistance, hors schéma OpenAPI) vivent dans `quizzam/src/quiz/payloads/` — voir *Journal (plan refactor — étape 2, module `quiz` : DTO HTTP vs payloads)* dans le même [refactor.md](../../quizzy-front-renew-app/docs/refactor.md#refactoring-des-objets-dto).  
- Les **vues lues / effets côté dépôt** (liste HATEOAS, snapshot d’`executionId`, résultat de suppression, opérations de patch) sont modélisées dans `quizzam/src/quiz/models/` — *Journal (plan refactor — étape 3, module `quiz` : persistance / domaine vs DTO HTTP)*.  
- Les réponses **400** documentées dans OpenAPI utilisent le schéma **`HttpValidationErrorDto`** (`statusCode`, `message`, `error`) — forme par défaut de Nest pour validation ou `BadRequestException`. La classe est aussi enregistrée comme **`extraModels`** à la génération du document Swagger (`main.ts`) pour qu’elle apparaisse sous **`/api/docs` → `components` → `schemas`** même si un client ne touche qu’une route isolée.  
- Les erreurs **4xx/5xx** « classiques » Nest (hors cas ci-dessus) partagent le schéma **`HttpExceptionBodyDto`** (mêmes champs) — en **`extraModels`** et référencé par les décorateurs d’opérations `ApiHttp*` sur les contrôleurs (voir *Journal (étape 4 — harmonisation transverse Quizzam)*).  
- Certaines **réponses GET** (ex. profil utilisateur, détail quiz) sont assemblées avec **`class-transformer`** (`plainToInstance` sur le DTO de réponse documenté) — *Journal (étape 5 — réponses HTTP / `plainToInstance`)*.  
- Pour voir **schémas, exemples et contraintes** par route : **Swagger** à l’URL ci-dessus.

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

### MongoDB — champ `executionId` (session de quiz)

- **`executionId`** n’est **pas** défini à la création du document : il est écrit **uniquement** lors de `POST /api/quiz/:id/start` (code alphanumérique **6 caractères**), et sert à `/api/execution/:executionId` et au WebSocket.
- Si d’anciens documents ont reçu par erreur un **UUID** à la création, supprimez ce champ en base pour les brouillons (ou corrigez l’index) : en **mongosh**, par ex. `db.quizzes.updateMany({ executionId: { $regex: /^[0-9a-f-]{36}$/ } }, { $unset: { executionId: "" } })` (adapter le filtre à votre cas). Après changement d’index Mongoose (`sparse` sur `executionId`), un redémarrage peut recréer l’index ; en cas de conflit, supprimez l’ancien index `executionId` sur la collection puis relancez l’API.

### Prochaine tâche (backlog)

- **Côté Quizzam (REST)** : ajouter des routes pour **(1) récupérer le score** d'une session / participant et **(2) enregistrer le choix utilisateur et/ou le score** (complément du scoring uniquement côté client, ex. `localStorage` sur la page join, qui ne persiste pas côté serveur).
- À préciser au design : identité du participant (anonyme vs utilisateur authentifié), clé de session (`executionId`), modèle de persistance (collection dédiée aux réponses / scores, champs sur la session, etc.) et DTOs Swagger.
