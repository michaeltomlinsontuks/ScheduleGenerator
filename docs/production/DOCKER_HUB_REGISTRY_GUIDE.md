# Docker Hub Registry Setup Guide

Complete guide for setting up Docker Hub as your container registry for the UP Schedule Generator, including image building, pushing, and deployment workflows.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Docker Hub Account Setup](#docker-hub-account-setup)
4. [Building and Pushing Images](#building-and-pushing-images)
5. [Deployment Configuration](#deployment-configuration)
6. [CI/CD Integration](#cicd-integration)
7. [Image Management](#image-management)
8. [Troubleshooting](#troubleshooting)

## Overview

Docker Hub is a cloud-based registry service that allows you to store and distribute Docker images. This guide covers using Docker Hub for the UP Schedule Generator application.

### Why Docker Hub?

**Advantages:**
- Free for public repositories
- Easy to set up and use
- Integrated with Docker CLI
- Automatic builds available
- Good for small to medium projects
- No infrastructure to manage

**Limitations:**
- Public images are visible to everyone (or $5/month for private)
- Rate limits: 100 pulls per 6 hours for anonymous users, 200 for authenticated
- Image size limits: No hard limit but large images may be slow

### Architecture

```
┌─────────────────┐
│ Local Machine   │
│                 │
│ 1. Build Images │
│ 2. Tag Images   │
│ 3. Push to Hub  │
└────────┬────────┘
         │
         │ docker push
         ▼
┌─────────────────┐
│   Docker Hub    │
│                 │
│ - frontend      │
│ - backend       │
│ - pdf-worker    │
└────────┬────────┘
         │
         │ docker pull
         ▼
┌─────────────────┐
│  EC2 Instance   │
│                 │
│ 1. Pull Images  │
│ 2. Deploy       │
└─────────────────┘
```

## Prerequisites

### Required
- [ ] Docker installed locally (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] Git repository with application code
- [ ] Email address for Docker Hub account

### Recommended
- [ ] GitHub account (for CI/CD)
- [ ] Basic understanding of Docker concepts
- [ ] SSH access to deployment server

## Docker Hub Account Setup

### Step 1: Create Docker Hub Account

1. **Go to Docker Hub:**
   - Visit: https://hub.docker.com/signup

2. **Sign up:**
   - Enter your Docker ID (username)
   - Email address
   - Password
   - Click "Sign Up"

3. **Verify email:**
   - Check your email for verification link
   - Click to verify your account

4. **Choose plan:**
   - **Free Plan:** Unlimited public repositories, 1 private repository
   - **Pro Plan ($5/month):** Unlimited private repositories, more pulls
   - For development/testing: Free plan is sufficient

### Step 2: Create Repositories

You need to create three repositories for the UP Schedule Generator:

1. **Log into Docker Hub:**
   - Go to https://hub.docker.com

2. **Create repositories:**

   **Repository 1: Frontend**
   - Click "Create Repository"
   - Name: `schedgen-frontend`
   - Description: "UP Schedule Generator - Next.js Frontend"
   - Visibility: Public (or Private with Pro plan)
   - Click "Create"

   **Repository 2: Backend**
   - Click "Create Repository"
   - Name: `schedgen-backend`
   - Description: "UP Schedule Generator - NestJS Backend API"
   - Visibility: Public (or Private with Pro plan)
   - Click "Create"

   **Repository 3: PDF Worker**
   - Click "Create Repository"
   - Name: `schedgen-pdf-worker`
   - Description: "UP Schedule Generator - Python PDF Parser"
   - Visibility: Public (or Private with Pro plan)
   - Click "Create"

3. **Note your repositories:**
   ```
   yourusername/schedgen-frontend
   yourusername/schedgen-backend
   yourusername/schedgen-pdf-worker
   ```

### Step 3: Generate Access Token (Recommended)

For security, use an access token instead of your password:

1. **Go to Account Settings:**
   - Click your username → Account Settings
   - Click "Security"

2. **Create Access Token:**
   - Click "New Access Token"
   - Description: "UP Schedule Generator Deployment"
   - Access permissions: "Read, Write, Delete"
   - Click "Generate"

3. **Save the token:**
   ```bash
   # IMPORTANT: Save this token securely!
   # You won't be able to see it again
   dckr_pat_xxxxxxxxxxxxxxxxxxxxx
   ```

## Building and Pushing Images

### Step 1: Login to Docker Hub

**Using password:**
```bash
docker login
# Enter username: yourusername
# Enter password: your-password
```

**Using access token (recommended):**
```bash
docker login -u yourusername
# Enter password: <paste your access token>
```

**Verify login:**
```bash
docker info | grep Username
# Should show: Username: yourusername
```

### Step 2: Build Images Locally

Navigate to your project directory:

```bash
cd ~/path/to/up-schedule-generator
```

**Build all images:**

```bash
# Frontend
docker build -t yourusername/schedgen-frontend:latest ./frontend

# Backend
docker build -t yourusername/schedgen-backend:latest ./backend

# PDF Worker
docker build -t yourusername/schedgen-pdf-worker:latest ./pdf-worker
```

**Build with version tags:**

```bash
VERSION=1.0.0

# Frontend
docker build -t yourusername/schedgen-frontend:latest \
             -t yourusername/schedgen-frontend:${VERSION} \
             ./frontend

# Backend
docker build -t yourusername/schedgen-backend:latest \
             -t yourusername/schedgen-backend:${VERSION} \
             ./backend

# PDF Worker
docker build -t yourusername/schedgen-pdf-worker:latest \
             -t yourusername/schedgen-pdf-worker:${VERSION} \
             ./pdf-worker
```

**Verify images:**
```bash
docker images | grep schedgen
```

### Step 3: Push Images to Docker Hub

**Push all images:**

```bash
# Frontend
docker push yourusername/schedgen-frontend:latest

# Backend
docker push yourusername/schedgen-backend:latest

# PDF Worker
docker push yourusername/schedgen-pdf-worker:latest
```

**Push with version tags:**

```bash
VERSION=1.0.0

# Frontend
docker push yourusername/schedgen-frontend:latest
docker push yourusername/schedgen-frontend:${VERSION}

# Backend
docker push yourusername/schedgen-backend:latest
docker push yourusername/schedgen-backend:${VERSION}

# PDF Worker
docker push yourusername/schedgen-pdf-worker:latest
docker push yourusername/schedgen-pdf-worker:${VERSION}
```

**Monitor push progress:**
- You'll see layers being pushed
- Large images may take several minutes
- First push is slowest; subsequent pushes only upload changed layers

### Step 4: Verify Images on Docker Hub

1. **Go to Docker Hub:**
   - Visit: https://hub.docker.com/u/yourusername

2. **Check each repository:**
   - Click on `schedgen-frontend`
   - Verify "Tags" tab shows `latest` (and version tags if pushed)
   - Check image size and last updated time
   - Repeat for `schedgen-backend` and `schedgen-pdf-worker`

## Deployment Configuration

### Step 1: Update Environment Variables

Add Docker Hub configuration to your `.env` file:

```bash
# Edit .env file
nano .env
```

Add these variables:

```bash
# Docker Hub Configuration
DOCKER_HUB_USERNAME=yourusername
IMAGE_TAG=latest

# Existing variables...
DOMAIN=yourdomain.com
NODE_ENV=production
# ... rest of your config
```

### Step 2: Deploy Using Registry Images

**Option A: Using docker-compose.registry.yml (Recommended)**

```bash
# Pull latest images and deploy
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               up -d

# View logs
docker compose logs -f
```

**Option B: Manually specify images**

Edit `docker-compose.yml` and replace build sections:

```yaml
services:
  frontend:
    image: yourusername/schedgen-frontend:latest
    # Remove or comment out build section
    # build:
    #   context: ./frontend
    #   dockerfile: Dockerfile
```

Then deploy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 3: Update Images (Rolling Updates)

When you push new images to Docker Hub:

```bash
# Pull latest images
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               pull

# Recreate containers with new images
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               up -d

# Verify deployment
docker compose ps
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/docker-build-push.yml`:

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [ main, develop ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

env:
  DOCKER_HUB_USERNAME: ${{ secrets.DOCKER_HUB_USERNAME }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        service: [frontend, backend, pdf-worker]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ secrets.DOCKER_HUB_USERNAME }}/schedgen-${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service }}
          file: ./${{ matrix.service }}/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ secrets.DOCKER_HUB_USERNAME }}/schedgen-${{ matrix.service }}:buildcache
          cache-to: type=registry,ref=${{ secrets.DOCKER_HUB_USERNAME }}/schedgen-${{ matrix.service }}:buildcache,mode=max

      - name: Image digest
        run: echo ${{ steps.build-and-push.outputs.digest }}
```

### Setup GitHub Secrets

1. **Go to GitHub repository:**
   - Settings → Secrets and variables → Actions

2. **Add secrets:**
   - `DOCKER_HUB_USERNAME`: Your Docker Hub username
   - `DOCKER_HUB_TOKEN`: Your Docker Hub access token

3. **Test workflow:**
   - Push to main branch
   - Check Actions tab for build status

### Automated Deployment Script

Create `scripts/deploy-from-registry.sh`:

```bash
#!/bin/bash
set -e

# Configuration
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-yourusername}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🚀 Deploying UP Schedule Generator from Docker Hub"
echo "   Username: $DOCKER_HUB_USERNAME"
echo "   Tag: $IMAGE_TAG"

# Login to Docker Hub (if needed)
if ! docker info | grep -q "Username: $DOCKER_HUB_USERNAME"; then
    echo "📝 Logging into Docker Hub..."
    docker login
fi

# Pull latest images
echo "📥 Pulling latest images..."
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               pull

# Stop old containers
echo "🛑 Stopping old containers..."
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               down

# Start new containers
echo "▶️  Starting new containers..."
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml \
               -f docker-compose.registry.yml \
               up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."
docker compose ps

# Verify deployment
echo "✅ Verifying deployment..."
./scripts/verify-deployment.sh

echo "✨ Deployment complete!"
```

Make it executable:

```bash
chmod +x scripts/deploy-from-registry.sh
```

## Image Management

### Tagging Strategy

Use semantic versioning for production releases:

```bash
# Development builds
yourusername/schedgen-frontend:develop
yourusername/schedgen-frontend:feature-xyz

# Staging builds
yourusername/schedgen-frontend:staging

# Production releases
yourusername/schedgen-frontend:latest
yourusername/schedgen-frontend:1.0.0
yourusername/schedgen-frontend:1.0
yourusername/schedgen-frontend:1

# Git commit SHA (for rollback)
yourusername/schedgen-frontend:sha-abc123
```

### Build Script with Tagging

Create `scripts/build-and-push.sh`:

```bash
#!/bin/bash
set -e

# Configuration
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-yourusername}"
VERSION="${1:-latest}"
GIT_SHA=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🏗️  Building and pushing images"
echo "   Version: $VERSION"
echo "   Git SHA: $GIT_SHA"
echo "   Branch: $GIT_BRANCH"

# Function to build and push a service
build_and_push() {
    local service=$1
    local context=$2
    
    echo ""
    echo "📦 Building $service..."
    
    docker build \
        -t $DOCKER_HUB_USERNAME/schedgen-$service:latest \
        -t $DOCKER_HUB_USERNAME/schedgen-$service:$VERSION \
        -t $DOCKER_HUB_USERNAME/schedgen-$service:$GIT_BRANCH-$GIT_SHA \
        $context
    
    echo "📤 Pushing $service..."
    docker push $DOCKER_HUB_USERNAME/schedgen-$service:latest
    docker push $DOCKER_HUB_USERNAME/schedgen-$service:$VERSION
    docker push $DOCKER_HUB_USERNAME/schedgen-$service:$GIT_BRANCH-$GIT_SHA
    
    echo "✅ $service complete"
}

# Build and push all services
build_and_push "frontend" "./frontend"
build_and_push "backend" "./backend"
build_and_push "pdf-worker" "./pdf-worker"

echo ""
echo "✨ All images built and pushed successfully!"
echo ""
echo "📋 Images:"
echo "   $DOCKER_HUB_USERNAME/schedgen-frontend:$VERSION"
echo "   $DOCKER_HUB_USERNAME/schedgen-backend:$VERSION"
echo "   $DOCKER_HUB_USERNAME/schedgen-pdf-worker:$VERSION"
```

Make it executable:

```bash
chmod +x scripts/build-and-push.sh
```

Usage:

```bash
# Build and push with version
./scripts/build-and-push.sh 1.0.0

# Build and push as latest
./scripts/build-and-push.sh
```

### Cleaning Up Old Images

**On Docker Hub:**
1. Go to repository → Tags
2. Select old tags
3. Click "Delete"

**On local machine:**

```bash
# Remove unused images
docker image prune -a

# Remove specific version
docker rmi yourusername/schedgen-frontend:old-version
```

**On deployment server:**

```bash
# Remove unused images (keeps running containers)
docker image prune -a -f

# Remove all schedgen images except latest
docker images | grep schedgen | grep -v latest | awk '{print $3}' | xargs docker rmi
```

## Troubleshooting

### Authentication Issues

**Problem:** `unauthorized: authentication required`

**Solution:**
```bash
# Re-login to Docker Hub
docker logout
docker login

# Verify credentials
docker info | grep Username
```

### Rate Limit Errors

**Problem:** `You have reached your pull rate limit`

**Solution:**
```bash
# Login to increase rate limit
docker login

# Use authenticated pulls
# Free tier: 200 pulls per 6 hours
# Pro tier: Unlimited pulls
```

### Image Not Found

**Problem:** `Error response from daemon: manifest for yourusername/schedgen-frontend:latest not found`

**Solutions:**
1. **Verify image exists on Docker Hub:**
   ```bash
   # Check Docker Hub website
   # Or use Docker Hub API
   curl https://hub.docker.com/v2/repositories/yourusername/schedgen-frontend/tags
   ```

2. **Check image name spelling:**
   ```bash
   # Ensure username and repository name are correct
   echo $DOCKER_HUB_USERNAME
   ```

3. **Push image if missing:**
   ```bash
   docker push yourusername/schedgen-frontend:latest
   ```

### Slow Push/Pull

**Problem:** Images taking too long to upload/download

**Solutions:**

1. **Optimize Dockerfile:**
   ```dockerfile
   # Use multi-stage builds
   FROM node:20-alpine AS builder
   # ... build steps
   
   FROM node:20-alpine
   # Copy only necessary files
   COPY --from=builder /app/dist ./dist
   ```

2. **Use .dockerignore:**
   ```
   node_modules
   .git
   .env
   *.log
   coverage
   ```

3. **Check network:**
   ```bash
   # Test Docker Hub connectivity
   curl -I https://hub.docker.com
   ```

### Wrong Architecture

**Problem:** `exec format error` on deployment server

**Solution:**
```bash
# Build for specific platform (e.g., ARM for some EC2 instances)
docker buildx build --platform linux/amd64,linux/arm64 \
    -t yourusername/schedgen-frontend:latest \
    --push \
    ./frontend
```

### Private Repository Access

**Problem:** Can't pull private images on server

**Solution:**
```bash
# Login on deployment server
ssh user@server
docker login

# Or use Docker config
# Copy ~/.docker/config.json to server
```

## Best Practices

### Security

1. **Use access tokens instead of passwords**
2. **Enable 2FA on Docker Hub account**
3. **Scan images for vulnerabilities:**
   ```bash
   docker scan yourusername/schedgen-frontend:latest
   ```
4. **Don't include secrets in images**
5. **Use private repositories for production**

### Performance

1. **Optimize image size:**
   - Use Alpine base images
   - Multi-stage builds
   - Remove unnecessary files

2. **Layer caching:**
   - Order Dockerfile commands from least to most frequently changing
   - Copy package files before source code

3. **Use BuildKit:**
   ```bash
   DOCKER_BUILDKIT=1 docker build -t image:tag .
   ```

### Workflow

1. **Tag strategy:**
   - `latest`: Current production
   - `develop`: Development branch
   - `v1.0.0`: Semantic versions
   - `sha-abc123`: Git commits (for rollback)

2. **Automated builds:**
   - Use CI/CD for consistent builds
   - Test before pushing
   - Automate deployment

3. **Documentation:**
   - Document image tags in README
   - Keep changelog updated
   - Document breaking changes

## Cost Considerations

### Free Tier Limits

- **Storage:** Unlimited for public repos
- **Pulls:** 200 per 6 hours (authenticated)
- **Private repos:** 1 included
- **Builds:** Manual only

### Pro Plan ($5/month)

- **Private repos:** Unlimited
- **Pulls:** Unlimited
- **Parallel builds:** 5 concurrent
- **Autobuilds:** Available

### Cost Optimization

1. **Use public repos for open source**
2. **Clean up old images regularly**
3. **Use image compression**
4. **Consider alternatives for large-scale:**
   - AWS ECR (if using AWS)
   - GitHub Container Registry (free for public)
   - Self-hosted registry

## Next Steps

1. **Set up automated builds** with GitHub Actions
2. **Implement image scanning** for security
3. **Create deployment pipeline** with staging/production
4. **Monitor image sizes** and optimize
5. **Document your tagging strategy** for the team

## Additional Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Docker Build Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Project Deployment Guide](AWS_EC2_DEPLOYMENT_GUIDE.md)

## Support

For Docker Hub specific issues:
- [Docker Hub Support](https://hub.docker.com/support)
- [Docker Community Forums](https://forums.docker.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/docker)

For application deployment issues:
- Check [Deployment Runbook](DEPLOYMENT_RUNBOOK.md)
- Review [Troubleshooting Guide](../guides/troubleshooting.md)

---

**Document Version:** 1.0  
**Last Updated:** 2024-11-30  
**Maintained By:** DevOps Team
