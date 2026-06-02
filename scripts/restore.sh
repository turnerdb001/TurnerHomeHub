#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: ./scripts/restore.sh backups/file.sql.gz"
  exit 1
fi

DB_NAME="${POSTGRES_DB:-turnerhomehub}"
DB_USER="${POSTGRES_USER:-turner}"

gzip -dc "$1" | docker compose exec -T database psql -U "$DB_USER" "$DB_NAME"
echo "Restore complete from $1"
