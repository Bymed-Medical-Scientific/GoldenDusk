#!/usr/bin/env bash
set -euo pipefail

# Restarts the full production stack after a git pull.
# Usage:
#   bash scripts/restart-after-pull.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose plugin is not available." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file not found at $ENV_FILE" >&2
  exit 1
fi

echo "==> Project root: $ROOT_DIR"
echo "==> Env file: $ENV_FILE"

cd "$ROOT_DIR"

echo "==> Building and restarting all services..."
docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans

echo "==> Current container status:"
docker compose ps

echo "==> Waiting for services to settle..."
sleep 5

echo "==> Health checks"
curl -fsS http://127.0.0.1:8080/health >/dev/null
echo "  - API health: OK"

curl -fsS http://127.0.0.1:3000 >/dev/null
echo "  - Web health: OK"

curl -fsS http://127.0.0.1:4200/health >/dev/null
echo "  - Admin health: OK"

echo "==> Restart complete."
