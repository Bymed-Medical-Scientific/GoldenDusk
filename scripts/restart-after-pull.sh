#!/usr/bin/env bash
set -euo pipefail

# Restarts the full production stack after a git pull.
# Usage:
#   bash scripts/restart-after-pull.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
NGINX_SITE_CONFIG="${NGINX_SITE_CONFIG:-/etc/nginx/sites-available/bymed.co.zw}"

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

restart_nginx() {
  echo "==> Restarting Nginx..."

  if [[ ! -f "$NGINX_SITE_CONFIG" ]]; then
    echo "Error: expected Nginx site config not found at $NGINX_SITE_CONFIG" >&2
    return 1
  fi

  echo "==> Validating Nginx configuration..."
  if ! sudo nginx -t; then
    echo "Error: nginx config validation failed. Check $NGINX_SITE_CONFIG" >&2
    return 1
  fi
  echo "  - Nginx config validation: OK ($NGINX_SITE_CONFIG)"

  if command -v systemctl >/dev/null 2>&1; then
    if sudo systemctl restart nginx; then
      echo "  - Nginx restarted via systemctl."
      return 0
    fi
  fi

  if command -v service >/dev/null 2>&1; then
    if sudo service nginx restart; then
      echo "  - Nginx restarted via service."
      return 0
    fi
  fi

  if command -v nginx >/dev/null 2>&1; then
    if sudo nginx -s reload; then
      echo "  - Nginx reloaded via nginx -s reload."
      return 0
    fi
  fi

  echo "Error: unable to restart Nginx. Ensure nginx is installed and this user has sudo access." >&2
  return 1
}

echo "==> Project root: $ROOT_DIR"
echo "==> Env file: $ENV_FILE"

cd "$ROOT_DIR"

echo "==> Building and restarting all services..."
docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans

echo "==> Running database migrations..."
# Migrations are applied by the API on startup when Database__ApplyMigrations=true.
# Restarting the API explicitly ensures migrations run after this deployment.
docker compose --env-file "$ENV_FILE" restart api

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

restart_nginx

echo "==> Restart complete (services + migrations + nginx)."
