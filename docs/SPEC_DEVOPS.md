# DevOps Specification - UP Schedule Generator V3

## Overview

Docker-based deployment with Traefik reverse proxy, supporting configurable domains via environment variables for self-hosted deployment on personal server or VPS.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 HOST MACHINE                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DOCKER NETWORK: schedgen                      │   │
│  │                                                                      │   │
│  │  ┌──────────────┐                                                   │   │
│  │  │   TRAEFIK    │◄──── Port 80 (HTTP)                              │   │
│  │  │              │◄──── Port 443 (HTTPS)                            │   │
│  │  │              │◄──── Port 8080 (Dashboard)                       │   │
│  │  └──────┬───────┘                                                   │   │
│  │         │                                                           │   │
│  │         ├─────────────────┬─────────────────┐                      │   │
│  │         ▼                 ▼                 ▼                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │   FRONTEND   │  │   BACKEND    │  │  PDF-WORKER  │             │   │
│  │  │   (Next.js)  │  │   (NestJS)   │  │   (Python)   │             │   │
│  │  │   Port 3000  │  │   Port 3001  │  │   Port 5000  │             │   │
│  │  └──────────────┘  └──────┬───────┘  └──────────────┘             │   │
│  │                           │                                        │   │
│  │         ┌─────────────────┼─────────────────┐                      │   │
│  │         ▼                 ▼                 ▼                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │  POSTGRESQL  │  │    REDIS     │  │    MINIO     │             │   │
│  │  │   Port 5432  │  │   Port 6379  │  │  Port 9000   │             │   │
│  │  └──────────────┘  └──────────────┘  │  Port 9001   │             │   │
│  │                                       └──────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Volumes:                                                                   │
│  - postgres_data                                                            │
│  - redis_data                                                               │
│  - minio_data                                                               │
│  - traefik_certs                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
/
├── docker-compose.yml           # Main compose file
├── docker-compose.dev.yml       # Development overrides
├── docker-compose.prod.yml      # Production overrides
├── .env.example                 # Environment template
├── .env                         # Local environment (gitignored)
│
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── ...
│
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── ...
│
├── pdf-worker/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py                   # Flask/FastAPI service
│   └── parser/                  # V2 parser code
│
├── traefik/
│   ├── traefik.yml              # Static config
│   ├── dynamic/
│   │   └── middlewares.yml      # Dynamic config
│   └── certs/                   # SSL certificates (if self-signed)
│
└── scripts/
    ├── init-minio.sh            # Create bucket on startup
    ├── backup-db.sh             # Database backup script
    └── deploy.sh                # Deployment helper
```

---

## Docker Compose

### Main Compose File
```yaml
# docker-compose.yml
version: '3.8'

services:
  # ===================
  # REVERSE PROXY
  # ===================
  traefik:
    image: traefik:v3.0
    container_name: schedgen-traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik/dynamic:/etc/traefik/dynamic:ro
      - traefik_certs:/etc/traefik/certs
    environment:
      - TRAEFIK_DASHBOARD_USER=${TRAEFIK_DASHBOARD_USER}
      - TRAEFIK_DASHBOARD_PASSWORD=${TRAEFIK_DASHBOARD_PASSWORD}
    networks:
      - schedgen
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_DASHBOARD_USER}:${TRAEFIK_DASHBOARD_PASSWORD}"

  # ===================
  # FRONTEND
  # ===================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: schedgen-frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=${BACKEND_URL}
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    depends_on:
      - backend
    networks:
      - schedgen
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls=true"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"

  # ===================
  # BACKEND
  # ===================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: schedgen-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=${MINIO_BUCKET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_CALLBACK_URL=${BACKEND_URL}/api/auth/google/callback
      - FRONTEND_URL=${FRONTEND_URL}
      - PDF_WORKER_URL=http://pdf-worker:5000
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - schedgen
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls=true"
      - "traefik.http.services.backend.loadbalancer.server.port=3001"

  # ===================
  # PDF WORKER
  # ===================
  pdf-worker:
    build:
      context: ./pdf-worker
      dockerfile: Dockerfile
    container_name: schedgen-pdf-worker
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
    networks:
      - schedgen
    # No Traefik labels - internal only

  # ===================
  # DATABASE
  # ===================
  postgres:
    image: postgres:16-alpine
    container_name: schedgen-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - schedgen
    # No Traefik labels - internal only

  # ===================
  # QUEUE
  # ===================
  redis:
    image: redis:7-alpine
    container_name: schedgen-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - schedgen
    # No Traefik labels - internal only

  # ===================
  # OBJECT STORAGE
  # ===================
  minio:
    image: minio/minio
    container_name: schedgen-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    networks:
      - schedgen
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minio-console.rule=Host(`minio.${DOMAIN}`)"
      - "traefik.http.routers.minio-console.entrypoints=websecure"
      - "traefik.http.routers.minio-console.tls=true"
      - "traefik.http.routers.minio-console.service=minio-console"
      - "traefik.http.services.minio-console.loadbalancer.server.port=9001"

networks:
  schedgen:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  traefik_certs:
```

---

## Development Compose Override

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  frontend:
    build:
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
    labels:
      - "traefik.http.routers.frontend.rule=Host(`localhost`)"
      - "traefik.http.routers.frontend.entrypoints=web"
      - "traefik.http.routers.frontend.tls=false"

  backend:
    build:
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    labels:
      - "traefik.http.routers.backend.rule=Host(`localhost`) && PathPrefix(`/api`)"
      - "traefik.http.routers.backend.entrypoints=web"
      - "traefik.http.routers.backend.tls=false"

  pdf-worker:
    volumes:
      - ./pdf-worker:/app
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=1

  traefik:
    ports:
      - "80:80"
      - "8080:8080"
    # No HTTPS in dev
```

---

## Dockerfiles

### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Frontend Dev Dockerfile
```dockerfile
# frontend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### Backend Dev Dockerfile
```dockerfile
# backend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]
```

### PDF Worker Dockerfile
```dockerfile
# pdf-worker/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for pdfplumber
RUN apt-get update && apt-get install -y \
    libpoppler-cpp-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

---

## Traefik Configuration

### Static Configuration
```yaml
# traefik/traefik.yml
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: schedgen
  file:
    directory: /etc/traefik/dynamic
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${ACME_EMAIL}
      storage: /etc/traefik/certs/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO

accessLog: {}
```

### Dynamic Middlewares
```yaml
# traefik/dynamic/middlewares.yml
http:
  middlewares:
    secure-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true
        forceSTSHeader: true
        contentTypeNosniff: true
        browserXssFilter: true
        referrerPolicy: "strict-origin-when-cross-origin"
        
    rate-limit:
      rateLimit:
        average: 100
        burst: 50
```

---

## Environment Variables

### .env.example
```env
# ===================
# DOMAIN CONFIGURATION
# ===================
# Set your domain here. For local development, use localhost
# For production, use your actual domain (e.g., schedule.example.com)
DOMAIN=localhost

# Full URLs (auto-constructed from DOMAIN in production)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# ===================
# DATABASE
# ===================
POSTGRES_USER=schedgen
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_DB=schedgen

# ===================
# REDIS
# ===================
# No auth needed for internal network
REDIS_HOST=redis
REDIS_PORT=6379

# ===================
# MINIO (S3)
# ===================
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=change_me_in_production
MINIO_BUCKET=pdf-uploads

# ===================
# GOOGLE OAUTH
# ===================
# Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# ===================
# TRAEFIK
# ===================
# Generate password hash: htpasswd -nb admin password
TRAEFIK_DASHBOARD_USER=admin
TRAEFIK_DASHBOARD_PASSWORD=$apr1$xyz...

# For Let's Encrypt (production only)
ACME_EMAIL=your-email@example.com

# ===================
# MISC
# ===================
NODE_ENV=development
```

---

## Scripts

### Initialize MinIO Bucket
```bash
#!/bin/bash
# scripts/init-minio.sh

# Wait for MinIO to be ready
until curl -s http://minio:9000/minio/health/live; do
  echo "Waiting for MinIO..."
  sleep 2
done

# Create bucket using mc (MinIO Client)
mc alias set local http://minio:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY}
mc mb local/${MINIO_BUCKET} --ignore-existing
mc anonymous set none local/${MINIO_BUCKET}

echo "MinIO bucket '${MINIO_BUCKET}' initialized"
```

### Database Backup
```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/schedgen_${TIMESTAMP}.sql.gz"

docker exec schedgen-postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > ${BACKUP_FILE}

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "schedgen_*.sql.gz" -mtime +7 -delete

echo "Backup created: ${BACKUP_FILE}"
```

### Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "Pulling latest changes..."
git pull origin main

echo "Building containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

echo "Running database migrations..."
docker compose exec backend npm run typeorm migration:run

echo "Restarting services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "Cleaning up old images..."
docker image prune -f

echo "Deployment complete!"
```

---

## Development Workflow

### Start Development Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Start all services in development mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker compose logs -f

# Access services:
# - Frontend: http://localhost
# - Backend API: http://localhost/api
# - Swagger: http://localhost/api/docs
# - Traefik Dashboard: http://localhost:8080
# - MinIO Console: http://localhost:9001
```

### Rebuild Single Service
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build frontend
```

### Run Backend Tests
```bash
docker compose exec backend npm run test
docker compose exec backend npm run test:e2e
docker compose exec backend npm run test:cov
```

### Database Operations
```bash
# Access PostgreSQL CLI
docker compose exec postgres psql -U schedgen -d schedgen

# Run migrations
docker compose exec backend npm run typeorm migration:run

# Generate migration
docker compose exec backend npm run typeorm migration:generate -- -n MigrationName
```

---

## Production Deployment

### Prerequisites
1. Server with Docker and Docker Compose installed
2. Domain pointing to server IP
3. Google OAuth credentials configured for production domain

### Steps
```bash
# 1. Clone repository
git clone https://github.com/yourusername/schedgen-v3.git
cd schedgen-v3

# 2. Create production .env
cp .env.example .env
nano .env  # Set production values

# 3. Set proper permissions
chmod 600 .env

# 4. Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Initialize MinIO bucket
docker compose exec backend sh /app/scripts/init-minio.sh

# 6. Run database migrations
docker compose exec backend npm run typeorm migration:run

# 7. Verify services
docker compose ps
curl https://your-domain.com/api/health
```

### SSL Certificates
Traefik automatically obtains Let's Encrypt certificates when:
1. `ACME_EMAIL` is set in `.env`
2. Domain DNS is properly configured
3. Ports 80 and 443 are accessible

For self-signed certificates (home server without domain):
```bash
# Generate self-signed cert
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout traefik/certs/privkey.pem \
  -out traefik/certs/fullchain.pem
```

---

## Monitoring

### Health Checks
```yaml
# Add to docker-compose.yml services
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Resource Usage
```bash
docker stats
```

---

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Use strong passwords (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Restrict Traefik dashboard access
- [ ] Set proper CORS origins
- [ ] Keep Docker images updated
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Use Docker secrets for sensitive data (optional)
