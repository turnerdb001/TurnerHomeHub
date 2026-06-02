#!/usr/bin/env bash
set -euo pipefail

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
DB_NAME="${POSTGRES_DB:-turnerhomehub}"
DB_USER="${POSTGRES_USER:-turner}"

docker compose exec -T database pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "backups/${DB_NAME}-${STAMP}.sql.gz"
echo "Backup written to backups/${DB_NAME}-${STAMP}.sql.gz"
