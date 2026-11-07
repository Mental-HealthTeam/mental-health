#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
ENV_FILE="${PROJECT_DIR}/.env"

S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-postgres}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-central-1}"
RESTORE_DB="${RESTORE_DB:-mental_health_restore_test}"

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <backup-filename.dump>" >&2
    exit 1
fi

BACKUP_FILENAME="$1"

# Accept only a filename, never a path.
if [[ ! "$BACKUP_FILENAME" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*\.dump$ ]]; then
    echo "ERROR: Invalid backup filename." >&2
    exit 1
fi

# Use a safe PostgreSQL identifier (maximum 63 characters).
if [[ ! "$RESTORE_DB" =~ ^[A-Za-z_][A-Za-z0-9_]{0,62}$ ]]; then
    echo "ERROR: Invalid RESTORE_DB name." >&2
    exit 1
fi

if [[ -z "$S3_BUCKET" ]]; then
    echo "ERROR: S3_BUCKET is not configured." >&2
    exit 1
fi

if [[ ! -f "$COMPOSE_FILE" || ! -f "$ENV_FILE" ]]; then
    echo "ERROR: docker-compose.yml or .env not found." >&2
    exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${DB_USER:?DB_USER is missing from .env}"

export AWS_DEFAULT_REGION

command -v aws >/dev/null 2>&1 || {
    echo "ERROR: AWS CLI is not installed." >&2
    exit 1
}

COMPOSE_ARGS=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

TEMP_FILE="$(mktemp)"
CONTAINER_TMP="/tmp/restore_${BACKUP_FILENAME}"
RESTORE_DB_CREATED=0

cleanup() {
    local exit_code=$?

    rm -f "$TEMP_FILE"

    if [[ "$RESTORE_DB_CREATED" -eq 1 && "$exit_code" -ne 0 ]]; then
        echo "Restore failed. Removing incomplete database..."
        "${COMPOSE_ARGS[@]}" exec -T db \
            dropdb --if-exists -U "$DB_USER" "$RESTORE_DB" \
            >/dev/null 2>&1 || true
    fi

    "${COMPOSE_ARGS[@]}" exec -T db \
        rm -f "$CONTAINER_TMP" >/dev/null 2>&1 || true

    exit "$exit_code"
}
trap cleanup EXIT

echo "Downloading backup from S3..."

aws s3 cp \
    "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILENAME}" \
    "$TEMP_FILE"

if [[ ! -s "$TEMP_FILE" ]]; then
    echo "ERROR: Downloaded backup is empty." >&2
    exit 1
fi

CONTAINER_ID="$("${COMPOSE_ARGS[@]}" ps -q db)"

if [[ -z "$CONTAINER_ID" ]]; then
    echo "ERROR: PostgreSQL container is not running." >&2
    exit 1
fi

echo "Copying backup into PostgreSQL container..."
docker cp "$TEMP_FILE" "${CONTAINER_ID}:${CONTAINER_TMP}"

echo "Validating backup..."
"${COMPOSE_ARGS[@]}" exec -T db \
    pg_restore --list "$CONTAINER_TMP" >/dev/null

echo "Checking target database..."

DB_EXISTS="$("${COMPOSE_ARGS[@]}" exec -T db \
    psql -U "$DB_USER" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname = '${RESTORE_DB}'")"

if [[ "$DB_EXISTS" == "1" ]]; then
    echo "ERROR: Database ${RESTORE_DB} already exists."
    echo "Choose another RESTORE_DB name. Nothing was overwritten."
    exit 1
fi

echo "Creating isolated restore database..."
"${COMPOSE_ARGS[@]}" exec -T db \
    createdb -U "$DB_USER" "$RESTORE_DB"

RESTORE_DB_CREATED=1

echo "Restoring backup..."
"${COMPOSE_ARGS[@]}" exec -T db \
    pg_restore -U "$DB_USER" -d "$RESTORE_DB" \
    --no-owner --no-privileges "$CONTAINER_TMP"

echo "Restore completed successfully."
echo "Restored database: $RESTORE_DB"