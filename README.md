# Quizzam

API NestJS pour le contenu des quiz (workspace [Nx](https://nx.dev)).

*English version : [Go to english version](./README.en.md)*
    
## Prérequis

- **Node.js** 20+ et **pnpm**
- **Docker** et Docker Compose (uniquement si tu suis la procédure Docker ci-dessous)

### Authentification et base de données

Les variables **`AUTH_TYPE`** et **`DATABASE_NAME`** se combinent. Point important :

- Si tu utilises **`DATABASE_NAME=MONGODB`**, fixe en général **`AUTH_TYPE=JWT`**, sauf si tu as déjà un **projet Firebase** opérationnel (Firebase Admin sur l’API, identifiants, **comptes dans Firebase Authentication** gérés côté Firebase / console). Sans ce socle, **`AUTH_TYPE=FIREBASE`** ne te permet pas un parcours inscription / connexion email–mot de passe classique vers Mongo : les routes **`POST /api/auth/register`** et **`POST /api/auth/login`** ne sont pas exposées, et les utilisateurs ne sont pas créés dans Mongo comme pour le flux JWT.
- **`AUTH_TYPE=JWT`** avec Mongo : les utilisateurs (email, hash de mot de passe, profil) sont stockés dans la base Mongo définie par **`DATABASE_URL`**.

Voir aussi les commentaires dans **`.env.example`**.

---

## Démarrage

Choisis **un** parcours : tout lancer avec Docker, ou Node sur ta machine avec MongoDB installé à part.

### 1. Avec Docker

Construit et exécute toujours l’**API** à partir de `docker/Dockerfile`, via `docker/compose.dev.yaml`.

**MongoDB + mongo-express** ne sont démarrés **que** si `DATABASE_NAME=MONGODB` dans `quizzam/.env` (valeur par défaut dans `.env.example`). Avec `FIREBASE`, `IN-MEMORY`, etc., ces conteneurs Mongo ne démarrent pas (Raison: inutile de lancer une stack Mongo vide).
Nous utilisons les profiles dans compose pour réaliser cette séparation.

1. Depuis le répertoire **`quizzam`**, copie les variables d’environnement et ajuste les secrets :

   ```sh
   cp .env.example .env
   ```

   Renseigne `DATABASE_NAME` selon ton backend (`MONGODB`, `FIREBASE`, `IN-MEMORY`, …), ainsi que `JWT_SECRET`, CORS, etc.

   **`DATABASE_URL` :** `.env.example` laisse **`localhost`** actif par défaut (`nx serve` ou Mongo sur l’hôte). **Uniquement** si tu lances l’**API dans Docker** avec la stack Mongo du compose (`DATABASE_NAME=MONGODB`), change la valeur en `DATABASE_URL=mongodb://mongodb:27017/quizapp` pour que le conteneur joigne le service `mongodb` sur le réseau compose. Si tu **n’utilises pas** Docker pour l’API, garde la version avec `localhost`.

2. Lancement :

   ```sh
   ./docker/start.sh
   ```

   Raccourci équivalent : `./docker/start` (même script).

   **Arrêt :** `./docker/start.sh down` — arrête **tout** (API classique, **api-watch**, Mongo, mongo-express), supprime le réseau et les orphelins (`--remove-orphans`). Avant, un `down` sans le profil `watch` laissait `quizzam-api-watch` actif et le réseau « in use ». Volumes (Mongo, `quizzam_node_modules`, …) : `./docker/start.sh down -v`.

   **Cycle rapide API (sans rebuild image) :**
   - `./docker/start.sh api-restart` (ou `./docker/start.sh restart-api`) : redémarre l’API sans reconstruire l’image.
   - `./docker/start.sh api-stop` (ou `./docker/start.sh stop-api`) : arrête l’API (et sa dépendance Mongo si activée).
   - Si `DATABASE_NAME=MONGODB`, le script applique automatiquement le profil Mongo et gère `mongodb` + `api`.
   - Sinon, seules les opérations sur `api` sont exécutées.
   - Après `./docker/start.sh` (`up`), le script suit directement les logs API en live dans le terminal (`logs -f api`).
     - Quitter l’affichage live : `Ctrl+C` (les conteneurs continuent de tourner).
     - Désactiver ce comportement : `QUIZZAM_FOLLOW_API_LOGS=0 ./docker/start.sh`.

   **Mode watch (dev inside container, sans rebuild à chaque changement) :**
   - `./docker/start.sh watch-up` (alias `dev-up`) : démarre `api-watch` avec bind mount du code (`quizzam` -> `/usr/src/app`) et watcher Nest/Nx dans le conteneur.
   - Les `node_modules` du conteneur sont dans un **volume Docker** (séparés de l’hôte) : au **démarrage**, un `pnpm install` est lancé pour se caler sur le `package.json` / `pnpm-lock.yaml` montés depuis l’hôte. Le dépôt inclut **`.npmrc`** (`confirm-modules-purge=false`) pour éviter le prompt interactif de pnpm sans TTY (sinon l’install peut s’arrêter avant d’avoir écrit les paquets). Après un changement de dépendance sur l’hôte, **commite le lockfile**, puis **redémarre** le watch — inutile de supprimer le volume à chaque fois.
   - Si le volume de deps semble corrompu : `watch-stop` puis `docker volume rm quizzam-dev_quizzam_node_modules` (ou le nom listé par `docker volume ls | grep quizzam`), puis `watch-up`.
   - Les modifications de code sur l’hôte sont prises en compte automatiquement dans le conteneur (hot reload).
   - `./docker/start.sh watch-stop` (alias `dev-stop`) : stoppe le mode watch.
   - Le service `api-watch` tourne d’abord en **root** le temps du `pnpm install` (le volume `node_modules` appartient à root par défaut) puis **Nx** en utilisateur **`node`**. TTY : `docker exec -it quizzam-api-watch sh` (root) ou `docker exec -it -u node quizzam-api-watch sh` pour un shell en `node`.
   - En mode watch, les logs `api-watch` sont suivis en live à la fin de la commande.

   **Import des quiz de démo (Mongo) :**
   - `./docker/start.sh dump-quizzes` : importe `docker/dump/quiz.json` dans `quizapp.quizzes` avec `--jsonArray --drop` (écrase la collection avant import).
   - `./docker/start.sh dump-users` : importe `docker/dump/user.json` dans `quizapp.users` avec `--jsonArray --drop` (écrase la collection avant import).
   - Identifiants de démo à utiliser dans l'écran de connexion :
     - **email** : `demo-user@quizapp.local`
     - **mot de passe** : `password123`
   - Pour créer un autre utilisateur de dump, génère `passwordHash` avec la même logique que l'API (scrypt, format `salt:hash`) :
   ```sh
   node -e 'const crypto=require("crypto"); const salt=crypto.randomBytes(16).toString("hex"); const hash=crypto.scryptSync("password123",salt,64).toString("hex"); console.log(salt+":"+hash);'
   ```
   - Copie la sortie dans le champ `passwordHash` de `docker/dump/user.json` (le hash change à chaque exécution car le sel est aléatoire).

   Le script lit `.env` et n’ajoute `--profile mongodb` que lorsque `DATABASE_NAME=MONGODB` (y compris pour `down`, pour cibler les bons services).

   **Sans** le script (mode Mongo) :

   ```sh
   docker compose -f docker/compose.dev.yaml --profile mongodb up --build -d
   ```

   **Sans** Mongo (ex. Firebase / en mémoire) :

   ```sh
   docker compose -f docker/compose.dev.yaml up --build -d
   ```

3. **URLs**

   | Service            | URL |
   | ------------------ | --- |
   | API (préfixe REST) | `http://localhost:3002/api` (port hôte par défaut ; surcharge avec `QUIZZAM_HOST_PORT`) |
   | OpenAPI (Swagger UI) | `http://localhost:3002/api/docs` (même port hôte) |
   | mongo-express      | uniquement si `DATABASE_NAME=MONGODB` — `http://localhost:8086` |
   | MongoDB (depuis l’hôte) | uniquement si `DATABASE_NAME=MONGODB` — `mongodb://localhost:27017` / base `quizapp` |

   **mongo-express :** l’UI ne demande pas de mot de passe en dev (`ME_CONFIG_BASICAUTH=false` dans `compose.dev.yaml`). Sans cette option, l’image utilise souvent l’ancien couple **admin** / **pass** pour l’auth HTTP de l’interface — à éviter hors machine locale.

En mode profil Mongo, vérifie que les ports **27017**, **3002** (ou `QUIZZAM_HOST_PORT`) et **8086** sont libres.

**Journaux (mode Mongo) :** `cd docker && docker compose -f compose.dev.yaml --profile mongodb logs -f`

**Journaux (API seule) :** `cd docker && docker compose -f compose.dev.yaml logs -f`

**Firebase :** Compose ne provisionne pas Firebase. Si `DATABASE_NAME=FIREBASE` (ou si tu t’appuies sur Firebase pour l’auth / les données), crée un projet dans la [console Firebase](https://console.firebase.google.com/), ajoute les identifiants et configure `.env` (montage ou fourniture de `FIREBASE_KEY_PATH` dans le conteneur si besoin). C’est indépendant des services Mongo optionnels ci-dessus.

---

### 2. Installation manuelle (Node sur l’hôte)

À utiliser si tu préfères **ne pas** faire tourner l’API dans Docker. Il te faut tout de même une instance **MongoDB** joignable par l’app (installation locale, ou Mongo seul dans Docker si tu préfères).

1. Installe les dépendances depuis **`quizzam`** :

   ```sh
   pnpm install
   ```

2. Configure `.env` :

   ```sh
   cp .env.example .env
   ```

   Garde le **`DATABASE_URL`** par défaut avec **`localhost`** (la ligne `mongodb://mongodb…` reste **commentée** : elle sert uniquement à l’API **dans** Docker). Pointe vers ton instance Mongo, typiquement :

   ```env
   DATABASE_URL=mongodb://localhost:27017/quizapp
   ```

   Renseigne `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, etc. selon tes besoins.

3. Lance l’API en dev (rechargement à chaud) :

   ```sh
   npx nx serve quizzam
   ```

L’app écoute sur le `PORT` défini dans `.env` (voir `.env.example` ; défaut **3000** si tu ne changes rien).

---

## Autres commandes

```sh
npx nx build quizzam
```

```sh
npx nx show project quizzam
```

[Exécuter des tâches avec Nx](https://nx.dev/features/run-tasks)

### Tests e2e (HTTP)

Les specs sous `e2e/` envoient les requêtes vers l’URL dérivée de **`HOST`** et **`PORT`** (voir `e2e/src/constants.ts` et `e2e/src/support/test-setup.ts`), par défaut **`http://localhost:3000`**.

- L’**API en cours d’exécution** (souvent Docker : mappage hôte **`3002`**, via `QUIZZAM_HOST_PORT` dans le script `docker/`) : ne lance **pas** un second `npx nx serve` sur le **même** port. Pour cibler le conteneur, exporte le port hôte : par exemple `PORT=3002` (et `AUTH_TYPE=JWT` si besoin) puis `pnpm exec nx run e2e:e2e` — sans autre processus sur ce port.
- Pour un **`nx serve` local** en parallèle de Docker sur 3002, utilise un **autre** port libre (p.ex. `3000` ou `3010` dans ton `.env` côté Quizzam) et la **même** valeur de `PORT` quand tu lances l’e2e.

---

## Documentation API

- **Swagger (OpenAPI)** : interface interactive sur `/api/docs` (voir le tableau *URLs* ci-dessus selon ton port).
- **Contexte refactor (alignement des contrats avec le front)** : [../quizzy-front-renew-app/docs/refactor.md](../quizzy-front-renew-app/docs/refactor.md) (y compris `GET /api/quiz/:id` et le champ `id` dans le corps).
- **Notes HTTP côté Quizzam** : [docs/api.md](./docs/api.md).

---

## Liens utiles

- [Documentation Nx — Node](https://nx.dev/nx-api/node)
- [Nx et CI](https://nx.dev/ci/intro/ci-with-nx)
