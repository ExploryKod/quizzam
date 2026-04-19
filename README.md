# Quizzam

API NestJS pour le contenu des quiz (workspace [Nx](https://nx.dev)).

*English version : [Go to english version](./README.en.md)*
    
## Prérequis

- **Node.js** 20+ et **pnpm**
- **Docker** et Docker Compose (uniquement si tu suis la procédure Docker ci-dessous)

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

   **Arrêt :** `./docker/start.sh down` ou `./docker/start down` — supprime les conteneurs du projet. Pour enlever aussi les volumes (ex. données Mongo) : `./docker/start.sh down -v`.

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
   | API (Swagger)      | `http://localhost:3002/api` (port hôte par défaut ; surcharge avec `QUIZZAM_HOST_PORT`) |
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

---

## Liens utiles

- [Documentation Nx — Node](https://nx.dev/nx-api/node)
- [Nx et CI](https://nx.dev/ci/intro/ci-with-nx)
