#!/bin/bash
set -e

# UP Schedule Generator - Build and Push to Docker Hub
# Usage: ./scripts/build-and-push.sh [version]
# Example: ./scripts/build-and-push.sh 1.0.0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME}"
VERSION="${1:-latest}"
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

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

# Check if logged into Docker Hub
if ! docker info | grep -q "Username: $DOCKER_HUB_USERNAME"; then
    echo -e "${YELLOW}⚠️  Not logged into Docker Hub${NC}"
    echo -e "${BLUE}📝 Logging in...${NC}"
    docker login
fi

echo -e "${BLUE}🏗️  Building and pushing images${NC}"
echo -e "${BLUE}   Username: ${GREEN}$DOCKER_HUB_USERNAME${NC}"
echo -e "${BLUE}   Version: ${GREEN}$VERSION${NC}"
echo -e "${BLUE}   Git SHA: ${GREEN}$GIT_SHA${NC}"
echo -e "${BLUE}   Branch: ${GREEN}$GIT_BRANCH${NC}"
echo -e "${BLUE}   Build Date: ${GREEN}$BUILD_DATE${NC}"
echo ""

# Function to build and push a service
build_and_push() {
    local service=$1
    local context=$2
    local dockerfile="${3:-Dockerfile}"
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📦 Building $service...${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Build with multiple tags
    docker build \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$GIT_SHA" \
        --build-arg VERSION="$VERSION" \
        -t $DOCKER_HUB_USERNAME/schedgen-$service:latest \
        -t $DOCKER_HUB_USERNAME/schedgen-$service:$VERSION \
        -t $DOCKER_HUB_USERNAME/schedgen-$service:$GIT_BRANCH-$GIT_SHA \
        -f $context/$dockerfile \
        $context
    
    echo ""
    echo -e "${BLUE}📤 Pushing $service to Docker Hub...${NC}"
    
    # Push all tags
    docker push $DOCKER_HUB_USERNAME/schedgen-$service:latest
    docker push $DOCKER_HUB_USERNAME/schedgen-$service:$VERSION
    docker push $DOCKER_HUB_USERNAME/schedgen-$service:$GIT_BRANCH-$GIT_SHA
    
    echo -e "${GREEN}✅ $service complete${NC}"
}

# Build and push all services
build_and_push "frontend" "./frontend"
build_and_push "backend" "./backend"
build_and_push "pdf-worker" "./pdf-worker"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ All images built and pushed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Images available at:${NC}"
echo -e "   ${GREEN}$DOCKER_HUB_USERNAME/schedgen-frontend:$VERSION${NC}"
echo -e "   ${GREEN}$DOCKER_HUB_USERNAME/schedgen-backend:$VERSION${NC}"
echo -e "   ${GREEN}$DOCKER_HUB_USERNAME/schedgen-pdf-worker:$VERSION${NC}"
echo ""
echo -e "${BLUE}🔗 View on Docker Hub:${NC}"
echo -e "   https://hub.docker.com/u/$DOCKER_HUB_USERNAME"
echo ""
echo -e "${YELLOW}💡 To deploy these images:${NC}"
echo -e "   ./scripts/deploy-from-registry.sh"
echo ""
