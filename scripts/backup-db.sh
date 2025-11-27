#!/bin/bash
# =============================================================================
# PostgreSQL Database Backup Script
# =============================================================================
# Creates timestamped backups of the PostgreSQL database and removes
# backups older than 7 days.
# Requirements: 9.2
# =============================================================================

set -e

# Configuration from environment variables
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-schedgen}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_DB="${POSTGRES_DB:-schedgen}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

echo "=== PostgreSQL Backup Script ==="
echo "Database: ${POSTGRES_DB}"
echo "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "Backup directory: ${BACKUP_DIR}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if password is set
if [ -z "${POSTGRES_PASSWORD}" ]; then
    echo "ERROR: POSTGRES_PASSWORD environment variable is not set"
    exit 1
fi

# Create timestamped backup with gzip compression
echo "Creating backup: ${BACKUP_FILE}"
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-password \
    | gzip > "${BACKUP_FILE}"

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "ERROR: Backup file was not created"
    exit 1
fi

# Remove backups older than retention period
echo "Removing backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -print -delete | wc -l)
echo "Deleted ${DELETED_COUNT} old backup(s)"

# List current backups
echo ""
echo "Current backups:"
ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo "=== Backup complete ==="
