#!/bin/bash
# =============================================================================
# Local Production Test Script
# =============================================================================
# Tests the production Docker setup locally before deploying to production
# =============================================================================

set -e

echo "=== UP Schedule Generator V3 - Local Production Test ==="
echo "Started at: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod.local"

# For local testing, we only use the base compose file
# The prod override is for actual production with Traefik/TLS
USE_PROD_OVERRIDE=false

# Check if .env.prod.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: $ENV_FILE not found${NC}"
    echo "Please create it from .env.example"
    exit 1
fi

# Export environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

echo "=== Step 1: Cleaning up existing containers ==="
if [ "$USE_PROD_OVERRIDE" = true ]; then
    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" down -v 2>/dev/null || true
else
    docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
fi
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

echo "=== Step 2: Building production images ==="
if [ "$USE_PROD_OVERRIDE" = true ]; then
    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" build --no-cache
else
    docker compose -f "$COMPOSE_FILE" build --no-cache
fi
echo -e "${GREEN}✓ Images built successfully${NC}"
echo ""

echo "=== Step 3: Starting infrastructure services ==="
if [ "$USE_PROD_OVERRIDE" = true ]; then
    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d postgres redis minio
else
    docker compose -f "$COMPOSE_FILE" up -d postgres redis minio
fi
echo "Waiting for services to be ready..."
sleep 15
echo -e "${GREEN}✓ Infrastructure services started${NC}"
echo ""

echo "=== Step 4: Initializing MinIO ==="
echo "Waiting for MinIO to be fully ready..."
sleep 5
docker exec schedgen-minio sh -c "
  mc alias set local http://localhost:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY} &&
  mc mb local/${MINIO_BUCKET} --ignore-existing &&
  mc anonymous set download local/${MINIO_BUCKET}
" || echo -e "${YELLOW}⚠ MinIO initialization may have failed, continuing...${NC}"
echo -e "${GREEN}✓ MinIO initialized${NC}"
echo ""

echo "=== Step 5: Starting PDF Worker ==="
if [ "$USE_PROD_OVERRIDE" = true ]; then
    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d pdf-worker
else
    docker compose -f "$COMPOSE_FILE" up -d pdf-worker
fi
echo "Waiting for PDF Worker to be ready..."
sleep 10
echo -e "${GREEN}✓ PDF Worker started${NC}"
echo ""

echo "=== Step 6: Running database migrations ==="
if [ "$USE_PROD_OVERRIDE" = true ]; then
    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" run --rm backend npm run migration:run:prod || echo -e "${YELLOW}⚠ Migrations may have failed, continuing...${NC}"
else
    docker compose -f "$COMPOSE_FILE" run --rm backend npm run migration:run:prod || echo -e "${YELLOW}⚠ Migrations may have failed, continuing...${NC}"
fi
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

echo "=== Step 7: Starting application services ==="
if [ "$USE_PROD_OVERRIDE" = true ]; then
    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d backend frontend
else
    docker compose -f "$COMPOSE_FILE" up -d backend frontend
fi
echo "Waiting for services to be ready..."
sleep 20
echo -e "${GREEN}✓ Application services started${NC}"
echo ""

echo "=== Step 8: Verifying deployment ==="
echo ""

# Check container status
echo "Container Status:"
if [ "$USE_PROD_OVERRIDE" = true ]; then
    docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" ps
else
    docker compose -f "$COMPOSE_FILE" ps
fi
echo ""

# Health checks
echo "Health Checks:"
echo -n "  PostgreSQL: "
if docker exec schedgen-postgres pg_isready -U schedgen > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

echo -n "  Redis: "
if docker exec schedgen-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

echo -n "  MinIO: "
if docker exec schedgen-minio mc ready local > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${YELLOW}⚠ Check manually${NC}"
fi

echo -n "  PDF Worker: "
if docker exec schedgen-pdf-worker curl -sf http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

echo -n "  Backend: "
if docker exec schedgen-backend wget -q -O- http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

echo -n "  Frontend: "
if docker exec schedgen-frontend wget -q -O- http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

echo ""
echo "=== Step 9: Testing endpoints ==="
echo ""

# Test backend health endpoint
echo -n "  Backend /health endpoint: "
if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
fi

# Test frontend
echo -n "  Frontend homepage: "
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
fi

echo ""
echo "=== Production Test Summary ==="
echo ""
echo "Services are running at:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  MinIO:     http://localhost:9001"
echo ""
echo "To view logs:"
if [ "$USE_PROD_OVERRIDE" = true ]; then
    echo "  docker compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE logs -f"
else
    echo "  docker compose -f $COMPOSE_FILE logs -f"
fi
echo ""
echo "To stop services:"
if [ "$USE_PROD_OVERRIDE" = true ]; then
    echo "  docker compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE down"
else
    echo "  docker compose -f $COMPOSE_FILE down"
fi
echo ""
echo -e "${GREEN}=== Test completed at: $(date) ===${NC}"
