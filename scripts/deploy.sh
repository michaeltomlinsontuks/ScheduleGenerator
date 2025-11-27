#!/bin/bash
# =============================================================================
# Deployment Script
# =============================================================================
# Pulls latest code, rebuilds containers, runs migrations, and restarts services.
# Requirements: 9.3
# =============================================================================

set -e

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
GIT_BRANCH="${GIT_BRANCH:-main}"

echo "=== Deployment Script ==="
echo "Branch: ${GIT_BRANCH}"
echo "Started at: $(date)"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "ERROR: Not in a git repository"
    exit 1
fi

# Step 1: Pull latest code from git
echo "=== Step 1: Pulling latest code ==="
git fetch origin
git checkout "${GIT_BRANCH}"
git pull origin "${GIT_BRANCH}"
echo "Code updated successfully"
echo ""

# Step 2: Build containers with production compose
echo "=== Step 2: Building containers ==="
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" build --no-cache
echo "Containers built successfully"
echo ""

# Step 3: Run database migrations
echo "=== Step 3: Running database migrations ==="
# Start only the database first
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Run migrations via the backend container
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" run --rm backend npm run migration:run
echo "Migrations completed successfully"
echo ""

# Step 4: Restart services
echo "=== Step 4: Restarting services ==="
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" down
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" up -d
echo "Services restarted successfully"
echo ""

# Step 5: Clean up old images
echo "=== Step 5: Cleaning up old images ==="
docker image prune -f
echo "Old images cleaned up"
echo ""

# Verify services are running
echo "=== Verifying deployment ==="
sleep 10
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" ps

echo ""
echo "=== Deployment complete ==="
echo "Finished at: $(date)"
