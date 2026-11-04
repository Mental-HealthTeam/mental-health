#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_DIR}/docker-compose.yml}"
ENV_FILE="${ENV_FILE:-${PROJECT_DIR}/.env}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups}"

# Optional: configure this when the production S3 bucket exists.
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-postgres}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-central-1}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "ERROR: Compose file not found: $COMPOSE_FILE" >&2
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: Environment file not found: $ENV_FILE" >&2
    exit 1
fi

# The .env file must contain shell-compatible KEY=value entries.
set -a
source "$ENV_FILE"
set +a
export AWS_DEFAULT_REGION

: "${DB_USER:?DB_USER is missing from .env}"
: "${DB_NAME:?DB_NAME is missing from .env}"

# Use the Compose service name, not a hardcoded container name.
COMPOSE_ARGS=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

TIMESTAMP="$(date -u +'%Y%m%dT%H%M%SZ')"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"
TEMP_FILE="${BACKUP_FILE}.tmp"
CONTAINER_TMP="/tmp/${DB_NAME}_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

cleanup() {
    rm -f "$TEMP_FILE"
    "${COMPOSE_ARGS[@]}" exec -T db rm -f "$CONTAINER_TMP" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Checking PostgreSQL service..."
"${COMPOSE_ARGS[@]}" exec -T db pg_isready -U "$DB_USER" -d "$DB_NAME"

echo "Creating PostgreSQL custom-format dump..."
"${COMPOSE_ARGS[@]}" exec -T db \
    pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -f "$CONTAINER_TMP"

echo "Copying dump from container..."
CONTAINER_ID="$("${COMPOSE_ARGS[@]}" ps -q db)"
if [[ -z "$CONTAINER_ID" ]]; then
    echo "ERROR: Could not find the Compose db container." >&2
    exit 1
fi

docker cp "${CONTAINER_ID}:${CONTAINER_TMP}" "$TEMP_FILE"

if [[ ! -s "$TEMP_FILE" ]]; then
    echo "ERROR: Backup file is empty." >&2
    exit 1
fi

echo "Validating backup archive..."
docker cp "$TEMP_FILE" "${CONTAINER_ID}:/tmp/backup-validation.dump"
"${COMPOSE_ARGS[@]}" exec -T db \
    pg_restore --list /tmp/backup-validation.dump >/dev/null
"${COMPOSE_ARGS[@]}" exec -T db \
    rm -f /tmp/backup-validation.dump

mv "$TEMP_FILE" "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"

echo "Backup created and validated: $BACKUP_FILE"

# Upload only when an S3 bucket is configured.
if [[ -n "$S3_BUCKET" ]]; then
    command -v aws >/dev/null 2>&1 || {
        echo "ERROR: AWS CLI is required for S3 upload." >&2
        exit 1
    }

    echo "Uploading backup to S3..."
    aws s3 cp "$BACKUP_FILE" \
        "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "$BACKUP_FILE")"

    echo "Removing local backups older than 14 days..."
    find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.dump' -mtime +14 -delete
fi

echo "Backup completed successfully."