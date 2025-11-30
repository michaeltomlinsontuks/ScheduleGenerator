# Docker Hub Quick Reference

Quick commands and workflows for Docker Hub registry operations.

## Setup

```bash
# Set your Docker Hub username
export DOCKER_HUB_USERNAME=yourusername

# Login to Docker Hub
docker login

# Verify login
docker info | grep Username
```

## Build and Push

```bash
# Build and push all images (automated)
./scripts/build-and-push.sh

# Build and push with version tag
./scripts/build-and-push.sh 1.0.0

# Manual build and push
docker build -t $DOCKER_HUB_USERNAME/schedgen-frontend:latest ./frontend
docker push $DOCKER_HUB_USERNAME/schedgen-frontend:latest
```

## Deploy from Registry

```bash
# Deploy latest images
./scripts/deploy-from-registry.sh

# Deploy specific version
./scripts/deploy-from-registry.sh 1.0.0

# Manual deployment
export DOCKER_HUB_USERNAME=yourusername
export IMAGE_TAG=latest
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               up -d
```

## Update Deployment

```bash
# Pull latest images and restart
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               pull

docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               up -d
```

## Image Management

```bash
# List local images
docker images | grep schedgen

# Remove old local images
docker image prune -a

# View images on Docker Hub
curl https://hub.docker.com/v2/repositories/$DOCKER_HUB_USERNAME/schedgen-frontend/tags

# Delete specific tag (via Docker Hub web interface)
# Go to: https://hub.docker.com/u/$DOCKER_HUB_USERNAME
```

## Tagging Strategy

```bash
# Latest (production)
$DOCKER_HUB_USERNAME/schedgen-frontend:latest

# Version tags
$DOCKER_HUB_USERNAME/schedgen-frontend:1.0.0
$DOCKER_HUB_USERNAME/schedgen-frontend:1.0
$DOCKER_HUB_USERNAME/schedgen-frontend:1

# Branch + SHA (for rollback)
$DOCKER_HUB_USERNAME/schedgen-frontend:main-abc123

# Environment tags
$DOCKER_HUB_USERNAME/schedgen-frontend:develop
$DOCKER_HUB_USERNAME/schedgen-frontend:staging
```

## Troubleshooting

```bash
# Re-login if authentication fails
docker logout
docker login

# Check rate limits
curl -I https://hub.docker.com

# Verify image exists
docker pull $DOCKER_HUB_USERNAME/schedgen-frontend:latest

# Check image details
docker inspect $DOCKER_HUB_USERNAME/schedgen-frontend:latest
```

## Environment Variables

Add to `.env`:

```bash
DOCKER_HUB_USERNAME=yourusername
IMAGE_TAG=latest
```

## Links

- **Full Guide:** [DOCKER_HUB_REGISTRY_GUIDE.md](DOCKER_HUB_REGISTRY_GUIDE.md)
- **Deployment Guide:** [AWS_EC2_DEPLOYMENT_GUIDE.md](AWS_EC2_DEPLOYMENT_GUIDE.md)
- **Docker Hub:** https://hub.docker.com/u/$DOCKER_HUB_USERNAME

---

**Last Updated:** 2024-11-30
