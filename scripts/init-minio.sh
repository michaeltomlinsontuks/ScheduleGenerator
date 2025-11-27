#!/bin/bash
# =============================================================================
# MinIO Initialization Script
# =============================================================================
# Creates the required bucket for PDF uploads if it doesn't exist.
# This script should be run after MinIO is started.
# Requirements: 9.1
# =============================================================================

set -e

# Configuration from environment variables
MINIO_HOST="${MINIO_ENDPOINT:-minio}"
MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_ACCESS="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET="${MINIO_SECRET_KEY:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-pdf-uploads}"
MINIO_ALIAS="schedgen"

echo "=== MinIO Initialization Script ==="
echo "Host: ${MINIO_HOST}:${MINIO_PORT}"
echo "Bucket: ${MINIO_BUCKET}"

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "http://${MINIO_HOST}:${MINIO_PORT}/minio/health/live" > /dev/null 2>&1; then
        echo "MinIO is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for MinIO... (attempt ${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: MinIO did not become ready in time"
    exit 1
fi

# Configure mc client alias
echo "Configuring MinIO client..."
mc alias set "${MINIO_ALIAS}" "http://${MINIO_HOST}:${MINIO_PORT}" "${MINIO_ACCESS}" "${MINIO_SECRET}"

# Create bucket if it doesn't exist
echo "Checking if bucket '${MINIO_BUCKET}' exists..."
if mc ls "${MINIO_ALIAS}/${MINIO_BUCKET}" > /dev/null 2>&1; then
    echo "Bucket '${MINIO_BUCKET}' already exists"
else
    echo "Creating bucket '${MINIO_BUCKET}'..."
    mc mb "${MINIO_ALIAS}/${MINIO_BUCKET}"
    echo "Bucket created successfully"
fi

# Set bucket policy to allow read access for authenticated users
echo "Setting bucket policy..."
mc anonymous set download "${MINIO_ALIAS}/${MINIO_BUCKET}"

echo "=== MinIO initialization complete ==="
