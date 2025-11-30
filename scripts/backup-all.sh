#!/bin/bash
# =============================================================================
# Complete System Backup Script
# =============================================================================
# Creates timestamped backups of PostgreSQL database and MinIO volumes
# Removes backups older than 7 days
# Sends alerts on failure
# Requirements: 9.1, 9.4, 9.5
# =============================================================================

set -e

# Configuration from environment variables
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-schedgen}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_DB="${POSTGRES_DB:-schedgen}"

# MinIO configuration
MINIO_ENDPOINT="${MINIO_ENDPOINT:-minio:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY}"
MINIO_BUCKET="${MINIO_BUCKET:-schedgen-pdfs}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="${BACKUP_DIR}/db_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"
MINIO_BACKUP_FILE="${BACKUP_DIR}/minio_${MINIO_BUCKET}_${TIMESTAMP}.tar.gz"

# Alert configuration
ALERT_WEBHOOK_URL="${BACKUP_ALERT_WEBHOOK_URL:-}"
ALERT_EMAIL="${BACKUP_ALERT_EMAIL:-}"

# Exit codes
EXIT_SUCCESS=0
EXIT_DB_BACKUP_FAILED=1
EXIT_MINIO_BACKUP_FAILED=2
EXIT_VERIFICATION_FAILED=3

# =============================================================================
# Functions
# =============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

send_alert() {
    local message="$1"
    local severity="${2:-error}"
    
    log "ALERT [$severity]: $message"
    
    # Send webhook alert if configured
    if [ -n "$ALERT_WEBHOOK_URL" ]; then
        curl -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"Backup Alert [$severity]: $message\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || log "Failed to send webhook alert"
    fi
    
    # Send email alert if configured
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "Backup Alert [$severity]" "$ALERT_EMAIL" 2>/dev/null || log "Failed to send email alert"
    fi
}

verify_backup() {
    local file="$1"
    local min_size="${2:-1024}"  # Minimum 1KB by default
    
    if [ ! -f "$file" ]; then
        log "ERROR: Backup file not found: $file"
        return 1
    fi
    
    local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    if [ "$size" -lt "$min_size" ]; then
        log "ERROR: Backup file too small: $file ($size bytes)"
        return 1
    fi
    
    # Verify gzip integrity
    if [[ "$file" == *.gz ]]; then
        if ! gzip -t "$file" 2>/dev/null; then
            log "ERROR: Backup file corrupted: $file"
            return 1
        fi
    fi
    
    log "Backup verified: $file ($(du -h "$file" | cut -f1))"
    return 0
}

cleanup_old_backups() {
    log "Removing backups older than ${RETENTION_DAYS} days..."
    
    local deleted_count=0
    
    # Clean up database backups
    deleted_count=$(find "${BACKUP_DIR}" -name "db_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -print -delete 2>/dev/null | wc -l)
    log "Deleted ${deleted_count} old database backup(s)"
    
    # Clean up MinIO backups
    deleted_count=$(find "${BACKUP_DIR}" -name "minio_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -print -delete 2>/dev/null | wc -l)
    log "Deleted ${deleted_count} old MinIO backup(s)"
}

list_backups() {
    log ""
    log "Current backups:"
    log "Database backups:"
    ls -lh "${BACKUP_DIR}"/db_*.sql.gz 2>/dev/null || log "  No database backups found"
    log "MinIO backups:"
    ls -lh "${BACKUP_DIR}"/minio_*.tar.gz 2>/dev/null || log "  No MinIO backups found"
}

# =============================================================================
# Main Backup Process
# =============================================================================

log "=== Complete System Backup Script ==="
log "Database: ${POSTGRES_DB}"
log "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
log "MinIO Bucket: ${MINIO_BUCKET}"
log "Backup directory: ${BACKUP_DIR}"
log "Retention: ${RETENTION_DAYS} days"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check required environment variables
if [ -z "${POSTGRES_PASSWORD}" ]; then
    send_alert "POSTGRES_PASSWORD environment variable is not set" "critical"
    exit $EXIT_DB_BACKUP_FAILED
fi

if [ -z "${MINIO_ACCESS_KEY}" ] || [ -z "${MINIO_SECRET_KEY}" ]; then
    send_alert "MinIO credentials not set" "critical"
    exit $EXIT_MINIO_BACKUP_FAILED
fi

# =============================================================================
# PostgreSQL Database Backup
# =============================================================================

log ""
log "--- PostgreSQL Database Backup ---"
log "Creating backup: ${DB_BACKUP_FILE}"

if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --no-password \
    | gzip > "${DB_BACKUP_FILE}"; then
    
    if verify_backup "${DB_BACKUP_FILE}" 1024; then
        log "Database backup completed successfully"
    else
        send_alert "Database backup verification failed: ${DB_BACKUP_FILE}" "critical"
        exit $EXIT_VERIFICATION_FAILED
    fi
else
    send_alert "Database backup failed" "critical"
    exit $EXIT_DB_BACKUP_FAILED
fi

# =============================================================================
# MinIO Volume Backup
# =============================================================================

log ""
log "--- MinIO Volume Backup ---"
log "Creating backup: ${MINIO_BACKUP_FILE}"

# Use docker volume backup approach
if docker run --rm \
    -v schedgen_minio_data:/data:ro \
    -v "$(pwd)/${BACKUP_DIR}":/backup \
    alpine \
    tar czf "/backup/$(basename ${MINIO_BACKUP_FILE})" -C /data . 2>/dev/null; then
    
    if verify_backup "${MINIO_BACKUP_FILE}" 512; then
        log "MinIO backup completed successfully"
    else
        send_alert "MinIO backup verification failed: ${MINIO_BACKUP_FILE}" "critical"
        exit $EXIT_VERIFICATION_FAILED
    fi
else
    send_alert "MinIO backup failed" "critical"
    exit $EXIT_MINIO_BACKUP_FAILED
fi

# =============================================================================
# Cleanup and Summary
# =============================================================================

cleanup_old_backups
list_backups

log ""
log "=== Backup Complete ==="
log "Database backup: ${DB_BACKUP_FILE}"
log "MinIO backup: ${MINIO_BACKUP_FILE}"

# Send success notification
if [ -n "$ALERT_WEBHOOK_URL" ] || [ -n "$ALERT_EMAIL" ]; then
    send_alert "Backup completed successfully at $(date)" "info"
fi

exit $EXIT_SUCCESS
