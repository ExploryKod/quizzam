#!/usr/bin/env bash
# Stack dev Docker (compose.dev.yaml). MongoDB + mongo-express si DATABASE_NAME=MONGODB dans quizzam/.env.
# Depuis quizzam :
#   ./docker/start.sh          # ou ./docker/start.sh up
#   ./docker/start.sh down     # ou ./docker/start down
#   ./docker/start.sh down -v  # supprime aussi les volumes (données Mongo)

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_BASE="${PROJECT_DIR}/compose.dev.yaml"
SERVICE_NAME="quizzam-mongodb-dev"
API_NAME="quizzam-api"
MONGO_EXPRESS_PORT="8086"
MONGO_URI_HOST="mongodb://localhost:27017"
MONGO_URI_DOCKER="mongodb://mongodb:27017"
API_PORT="${QUIZZAM_HOST_PORT:-3002}"

info()  { echo -e "ℹ️  $1"; }
ok()    { echo -e "✅ $1"; }
warn()  { echo -e "⚠️  $1"; }
error() { echo -e "❌ $1"; }

read_database_name() {
  local f="${PROJECT_DIR}/../.env"
  local raw
  if [[ ! -f "$f" ]]; then
    echo "MONGODB"
    return
  fi
  raw=$(grep -E '^[[:space:]]*DATABASE_NAME=' "$f" | head -1 || true)
  if [[ -z "$raw" ]]; then
    echo "MONGODB"
    return
  fi
  raw="${raw#*=}"
  raw="${raw%%#*}"
  raw=$(echo "$raw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '"' | tr -d "'")
  [[ -n "$raw" ]] && echo "$raw" || echo "MONGODB"
}

DATABASE_NAME_VALUE="$(read_database_name)"
USE_MONGO=false
if [[ "$DATABASE_NAME_VALUE" == "MONGODB" ]]; then
  USE_MONGO=true
fi

PROFILE_ARGS=()
if [[ "$USE_MONGO" == true ]]; then
  PROFILE_ARGS=(--profile mongodb)
fi

cd "$PROJECT_DIR" || {
  error "Project directory not found: $PROJECT_DIR"
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  error "docker is required but not found in PATH."
  exit 1
fi

compose=(docker compose)
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    compose=(docker-compose)
  else
    error "docker compose (or docker-compose) is required."
    exit 1
  fi
fi

ACTION="${1:-up}"
case "$ACTION" in
  down)
    shift
    info "Stopping quizzam dev stack…"
    if [[ "$USE_MONGO" == true ]]; then
      info "DATABASE_NAME=MONGODB → arrêt avec profil « mongodb »."
    else
      info "DATABASE_NAME=$DATABASE_NAME_VALUE → arrêt sans profil Mongo."
    fi
    if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" down "$@"; then
      error "docker compose down failed"
      exit 1
    fi
    ok "Stack arrêtée (projet quizzam-dev)."
    exit 0
    ;;
  -h|--help|help)
    echo "Usage: $0 [up|down] [options]"
    echo ""
    echo "  up (default)   Démarre la stack (build si besoin)."
    echo "  down             Arrête et supprime les conteneurs."
    echo "  down -v          Idem + supprime les volumes compose (ex. données Mongo)."
    echo ""
    echo "Depuis le dossier quizzam : ./docker/start.sh   ou   ./docker/start"
    exit 0
    ;;
  up|start)
    [[ -n "${1:-}" ]] && shift
    ;;
  *)
    error "Commande inconnue : $ACTION — utilisation : $0 [up|down] (ou $0 --help)"
    exit 1
    ;;
esac

# ---------- up ----------
info "Starting quizzam dev stack (API in Docker${USE_MONGO:+, MongoDB + mongo-express})…"

if [[ ! -f "${PROJECT_DIR}/../.env" ]]; then
  warn "quizzam/.env missing — copy .env.example to .env (JWT_SECRET, etc.) before the API can run correctly."
fi

if [[ "$USE_MONGO" == true ]]; then
  info "DATABASE_NAME=MONGODB → MongoDB + mongo-express."
  if [[ -f "${PROJECT_DIR}/../.env" ]]; then
    db_url_line=$(grep -E '^[[:space:]]*DATABASE_URL=' "${PROJECT_DIR}/../.env" | head -1 || true)
    if [[ "$db_url_line" == *localhost* ]]; then
      warn "DATABASE_URL utilise encore localhost alors que l'API Docker doit joindre le service « mongodb » — voir .env.example : commenter localhost et décommenter mongodb://mongodb:27017/quizapp."
    fi
  fi
else
  info "DATABASE_NAME=$DATABASE_NAME_VALUE → pas de conteneurs Mongo (profil « mongodb » désactivé)."
fi

if [[ "$USE_MONGO" == true ]]; then
  info "Si les ports 27017, ${API_PORT} ou 8086 sont pris, arrête les services en conflit puis relance."
else
  info "Si le port ${API_PORT} est pris, arrête le service en conflit puis relance."
fi

if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" up -d --build; then
  error "Docker Compose failed to start"
  exit 1
fi

ok "Containers started (first run may take a while to build the API image)"

echo ""
info "Checking container status..."
"${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" ps

if [[ "$USE_MONGO" == true ]]; then
  info "Waiting for MongoDB to become ready…"
  READY=false
  for _ in {1..15}; do
    if docker exec "$SERVICE_NAME" mongosh --quiet --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; then
      READY=true
      break
    fi
    sleep 2
  done

  if [ "$READY" = false ]; then
    warn "MongoDB did not respond to ping in time"
    info "Showing recent logs:"
    docker logs "$SERVICE_NAME" --tail 30
    exit 1
  fi

  ok "MongoDB is ready"

  echo ""
  info "Recent MongoDB logs:"
  docker logs "$SERVICE_NAME" --tail 10
fi

echo ""
info "Recent API logs:"
docker logs "$API_NAME" --tail 15 2>/dev/null || warn "API container not logging yet — check: docker logs $API_NAME"

echo ""
echo "----------------------------------"
ok "Quizzam dev stack is running"
echo ""
echo "📂 Arrêt : ./docker/start.sh down"
echo "📂 Next start from quizzam:"
echo "   ./docker/start.sh"
echo ""
if [[ "$USE_MONGO" == true ]]; then
  echo "📡 MongoDB — accès depuis l’hôte (port 27017 mappé) : ${MONGO_URI_HOST}/quizapp"
  echo "   (mongosh, drivers sur ta machine, mongo-express utilisent cette URL.)"
  echo "📡 Même Mongo — accès depuis le conteneur « api » : ${MONGO_URI_DOCKER}/quizapp"
  echo "   (DATABASE_URL dans .env pour l’API Docker ; hôte du service = nom Compose « mongodb », pas localhost.)"
  echo "🧭 Mongo Express:  http://localhost:${MONGO_EXPRESS_PORT}"
fi
echo "🚀 API (Docker):   http://localhost:${API_PORT}/api"
echo ""
if [[ "$USE_MONGO" == true ]]; then
  echo "💡 nx serve sur la machine : DATABASE_URL=${MONGO_URI_HOST}/quizapp (même base, vue depuis l’hôte)."
else
  echo "💡 Vérifie DATABASE_NAME / Firebase / IN-MEMORY dans .env (pas de Mongo Docker)."
fi
echo ""
echo "🧾 Logs:"
if [[ "$USE_MONGO" == true ]]; then
  echo "   cd \"$PROJECT_DIR\" && ${compose[*]} -f compose.dev.yaml --profile mongodb logs -f"
  echo "   mongosh \"${MONGO_URI_HOST}\""
else
  echo "   cd \"$PROJECT_DIR\" && ${compose[*]} -f compose.dev.yaml logs -f"
fi
echo "----------------------------------"
