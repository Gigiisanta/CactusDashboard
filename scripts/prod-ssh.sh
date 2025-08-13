#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:-backend}"
NAME=""
case "$SERVICE" in
  backend) NAME="cactus-backend";;
  nginx) NAME="cactus-nginx";;
  frontend|frontend_prod) NAME="cactus-frontend-prod";;
  db|postgres) NAME="cactus-db";;
  redis) NAME="cactus-redis";;
  prometheus) NAME="cactus-prometheus";;
  grafana) NAME="cactus-grafana";;
  *) echo "Unknown service: $SERVICE" >&2; exit 1;;
esac

echo "Container: $NAME"
podman ps --format '{{.Names}}' | grep -qx "$NAME" || {
  echo "Starting stack to ensure $NAME exists..."
  python3 -m podman_compose -f "$(dirname "$0")/../docker-compose.yml" up -d >/dev/null
}
exec podman exec -it "$NAME" /bin/sh


