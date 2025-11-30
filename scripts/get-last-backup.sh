#!/bin/bash
# =============================================================================
# Get Last Deployment Backup Information
# =============================================================================
# Retrieves information about the last pre-deployment backup for rollback
# purposes. This script reads the .last-deployment-backup file created by
# the deployment script.
# =============================================================================

set -e

BACKUP_INFO_FILE=".last-deployment-backup"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== Last Deployment Backup Information ==="
echo ""

# Check if backup info file exists
if [ ! -f "${BACKUP_INFO_FILE}" ]; then
    echo -e "${RED}ERROR:${NC} No backup information found"
    echo "The file ${BACKUP_INFO_FILE} does not exist."
    echo "This file is created automatically during deployment."
    exit 1
fi

# Source the backup information
source "${BACKUP_INFO_FILE}"

# Display backup information
echo -e "${GREEN}Deployment Timestamp:${NC} ${DEPLOYMENT_TIMESTAMP}"
echo -e "${GREEN}Backup Directory:${NC} ${BACKUP_DIR}"
echo -e "${GREEN}Git Commit:${NC} ${GIT_COMMIT}"
echo -e "${GREEN}Git Branch:${NC} ${GIT_BRANCH}"
echo ""

# Check if backup files exist
echo "=== Backup Files ==="
echo ""

if [ -f "${DB_BACKUP_FILE}" ]; then
    DB_SIZE=$(du -h "${DB_BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓${NC} Database backup: ${DB_BACKUP_FILE} (${DB_SIZE})"
else
    echo -e "${RED}✗${NC} Database backup not found: ${DB_BACKUP_FILE}"
fi

if [ -f "${MINIO_BACKUP_FILE}" ]; then
    MINIO_SIZE=$(du -h "${MINIO_BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓${NC} MinIO backup: ${MINIO_BACKUP_FILE} (${MINIO_SIZE})"
else
    echo -e "${RED}✗${NC} MinIO backup not found: ${MINIO_BACKUP_FILE}"
fi

echo ""
echo "=== Usage for Rollback ==="
echo ""
echo "To restore the database:"
echo "  gunzip -c ${DB_BACKUP_FILE} | docker compose exec -T postgres psql -U schedgen -d schedgen"
echo ""
echo "To restore MinIO volumes:"
echo "  docker run --rm -v schedgen_minio_data:/data -v \$(pwd)/${BACKUP_DIR}:/backup alpine sh -c 'rm -rf /data/* && tar xzf /backup/\$(basename ${MINIO_BACKUP_FILE}) -C /data'"
echo ""
echo -e "${YELLOW}WARNING:${NC} Restoring from backup will overwrite current data!"
echo ""
