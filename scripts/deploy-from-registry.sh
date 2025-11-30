#!/bin/bash
set -e

# UP Schedule Generator - Deploy from Docker Hub Registry
# Usage: ./scripts/deploy-from-registry.sh [tag]
# Example: ./scripts/deploy-from-registry.sh 1.0.0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME}"
IMAGE_TAG="${1:-latest}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.registry.yml"

# Check if Docker Hub username is set
if [ -z "$DOCKER_HUB_USERNAME" ]; then
    echo -e "${RED}❌ Error: DOCKER_HUB_USERNAME environment variable is not set${NC}"
    echo -e "${YELLOW}💡 Set it in your .env file or export it:${NC}"
    echo -e "   export DOCKER_HUB_USERNAME=yourusername"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Check if compose files exist
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found${NC}"
    echo -e "${YELLOW}💡 Run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying UP Schedule Generator from Docker Hub${NC}"
echo -e "${BLUE}   Username: ${GREEN}$DOCKER_HUB_USERNAME${NC}"
echo -e "${BLUE}   Tag: ${GREEN}$IMAGE_TAG${NC}"
echo ""

# Login to Docker Hub (if needed)
if ! docker info | grep -q "Username: $DOCKER_HUB_USERNAME"; then
    echo -e "${YELLOW}⚠️  Not logged into Docker Hub${NC}"
    echo -e "${BLUE}📝 Logging in...${NC}"
    docker login
    echo ""
fi

# Export variables for docker-compose
export DOCKER_HUB_USERNAME
export IMAGE_TAG

# Pull latest images
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📥 Pulling latest images from Docker Hub...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker compose $COMPOSE_FILES pull
echo -e "${GREEN}✅ Images pulled successfully${NC}"
echo ""

# Create backup of current deployment (if running)
if docker compose ps | grep -q "Up"; then
    echo -e "${BLUE}💾 Creating backup of current deployment...${NC}"
    BACKUP_DIR="./backups/pre-deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker compose ps postgres | grep -q "Up"; then
        echo -e "${BLUE}   Backing up database...${NC}"
        docker compose exec -T postgres pg_dump -U ${POSTGRES_USER:-schedgen} ${POSTGRES_DB:-schedgen} > "$BACKUP_DIR/database.sql"
        echo -e "${GREEN}   ✅ Database backed up${NC}"
    fi
    
    echo -e "${GREEN}✅ Backup created at $BACKUP_DIR${NC}"
    echo ""
fi

# Stop old containers
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🛑 Stopping old containers...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker compose $COMPOSE_FILES down
echo -e "${GREEN}✅ Old containers stopped${NC}"
echo ""

# Start new containers
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}▶️  Starting new containers...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker compose $COMPOSE_FILES up -d
echo -e "${GREEN}✅ New containers started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 15

# Check service status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏥 Checking service health...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
docker compose ps
echo ""

# Verify deployment
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✅ Verifying deployment...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if verify script exists
if [ -f "./scripts/verify-deployment.sh" ]; then
    ./scripts/verify-deployment.sh
else
    echo -e "${YELLOW}⚠️  Verification script not found, performing basic checks...${NC}"
    
    # Basic health checks
    echo -e "${BLUE}Checking backend health...${NC}"
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi
    
    echo -e "${BLUE}Checking frontend...${NC}"
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
    else
        echo -e "${RED}❌ Frontend check failed${NC}"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "   Registry: ${GREEN}Docker Hub${NC}"
echo -e "   Username: ${GREEN}$DOCKER_HUB_USERNAME${NC}"
echo -e "   Tag: ${GREEN}$IMAGE_TAG${NC}"
echo -e "   Images:"
echo -e "     - ${GREEN}$DOCKER_HUB_USERNAME/schedgen-frontend:$IMAGE_TAG${NC}"
echo -e "     - ${GREEN}$DOCKER_HUB_USERNAME/schedgen-backend:$IMAGE_TAG${NC}"
echo -e "     - ${GREEN}$DOCKER_HUB_USERNAME/schedgen-pdf-worker:$IMAGE_TAG${NC}"
echo ""
echo -e "${BLUE}🔗 Access your application:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:3001${NC}"
echo -e "   Grafana: ${GREEN}http://localhost:3002${NC}"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo -e "   View logs: ${GREEN}docker compose logs -f${NC}"
echo -e "   Check status: ${GREEN}docker compose ps${NC}"
echo -e "   Stop services: ${GREEN}docker compose down${NC}"
echo ""
