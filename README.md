# UP Schedule Generator V3

A web application that converts University of Pretoria (UP) class schedule PDFs into Google Calendar events. Upload your PDF, preview the extracted events, and sync directly to your Google Calendar.

## Tech Stack

| Service | Technology |
|---------|------------|
| Frontend | Next.js 16, React 19, TailwindCSS, DaisyUI |
| Backend | NestJS 11, TypeORM, BullMQ |
| PDF Worker | Python FastAPI, pdfplumber |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Object Storage | MinIO |
| Reverse Proxy | Traefik v3 |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│ PDF Worker  │
│  (Next.js)  │     │  (NestJS)   │     │  (FastAPI)  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Postgres │    │  Redis   │    │  MinIO   │
   └──────────┘    └──────────┘    └──────────┘
```

## Prerequisites

- Docker & Docker Compose
- Google Cloud Console project with:
  - Calendar API enabled
  - OAuth 2.0 credentials configured

## Quick Start (Development)

1. Clone the repository and copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure your `.env` file with at minimum:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. Start all services:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

4. Initialize MinIO bucket (first time only):
   ```bash
   docker exec -it schedgen-minio mc alias set local http://localhost:9000 minioadmin minioadmin
   docker exec -it schedgen-minio mc mb local/pdf-uploads
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Traefik Dashboard: http://localhost:8081
   - MinIO Console: http://localhost:9001

### Development Features

- Hot reload enabled for frontend and backend
- All service ports exposed for debugging
- Volume mounts for live code changes

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 3001 |
| PDF Worker | 5001 |
| PostgreSQL | 5433 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## Production Deployment

### Option 1: Build Locally

1. Configure production environment variables in `.env`:
   ```bash
   NODE_ENV=production
   DOMAIN=yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   BACKEND_URL=https://api.yourdomain.com
   
   # Strong secrets
   SESSION_SECRET=generate-a-strong-secret
   POSTGRES_PASSWORD=generate-a-strong-password
   MINIO_SECRET_KEY=generate-a-strong-password
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
   
   # Let's Encrypt
   ACME_EMAIL=your-email@example.com
   ```

2. Deploy using the deployment script:
   ```bash
   ./scripts/deploy.sh
   ```

   Or manually:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Option 2: Deploy from Docker Hub Registry

1. Configure environment variables (same as above, plus):
   ```bash
   DOCKER_HUB_USERNAME=yourusername
   IMAGE_TAG=latest
   ```

2. Deploy from registry:
   ```bash
   ./scripts/deploy-from-registry.sh
   ```

   Or manually:
   ```bash
   docker compose -f docker-compose.yml \
                  -f docker-compose.prod.yml \
                  -f docker-compose.registry.yml \
                  up -d
   ```

See [Docker Hub Registry Guide](docs/production/DOCKER_HUB_REGISTRY_GUIDE.md) for complete setup instructions.

### Production Features

- TLS certificates via Let's Encrypt
- Security headers middleware
- Rate limiting on API endpoints
- Health checks on all services
- Horizontal scaling for PDF workers
- Prometheus metrics & Grafana dashboards
- Automated backups
- No exposed ports except 80/443

### Production Guides

- [AWS EC2 Deployment Guide](docs/production/AWS_EC2_DEPLOYMENT_GUIDE.md) - Deploy to AWS EC2
- [Docker Hub Registry Guide](docs/production/DOCKER_HUB_REGISTRY_GUIDE.md) - Container registry setup
- [Production Readiness Plan](docs/production/PRODUCTION_READINESS_PLAN.md) - 6-week implementation plan
- [Deployment Runbook](docs/production/DEPLOYMENT_RUNBOOK.md) - Step-by-step procedures
- [Monitoring Guide](docs/production/monitoring/README.md) - Observability setup

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable the **Google Calendar API**
4. Configure OAuth consent screen:
   - Add test users during development
   - Request scopes: `calendar.events`, `userinfo.email`, `userinfo.profile`
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - Dev: `http://localhost:3001/api/auth/google/callback`
     - Prod: `https://api.yourdomain.com/api/auth/google/callback`

## Utility Scripts

| Script | Description |
|--------|-------------|
| `scripts/deploy.sh` | Full deployment: pull, build, migrate, restart |
| `scripts/deploy-from-registry.sh` | Deploy from Docker Hub registry images |
| `scripts/build-and-push.sh` | Build and push images to Docker Hub |
| `scripts/rollback.sh` | Rollback failed deployment |
| `scripts/backup-all.sh` | Backup database and files with 7-day retention |
| `scripts/verify-deployment.sh` | Verify deployment health |
| `scripts/init-minio.sh` | Initialize MinIO bucket |

### Docker Registry Deployment

For production deployments using Docker Hub:

```bash
# Set your Docker Hub username
export DOCKER_HUB_USERNAME=yourusername

# Build and push images
./scripts/build-and-push.sh 1.0.0

# Deploy from registry
./scripts/deploy-from-registry.sh 1.0.0
```

See [Docker Hub Registry Guide](docs/production/DOCKER_HUB_REGISTRY_GUIDE.md) for detailed instructions.

### Backup & Recovery

```bash
# Manual backup (database + files)
./scripts/backup-all.sh

# Get last backup
./scripts/backup-all.sh --last

# Restore from backup
./scripts/backup-all.sh --restore backups/db_schedgen_20241130_020000.sql.gz

# Automated backups (Docker Compose)
docker compose -f docker-compose.yml -f docker-compose.backup.yml up -d backup
```

See [Backup Guide](docs/production/backup/README.md) for detailed instructions.

### Database Migrations

```bash
# Run migrations
docker compose exec backend npm run migration:run

# Revert last migration
docker compose exec backend npm run migration:revert

# Generate new migration
docker compose exec backend npm run migration:generate src/migrations/MigrationName
```

## Environment Variables

See [.env.example](.env.example) for all available configuration options.

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN` | Application domain | `localhost` |
| `NODE_ENV` | Environment mode | `development` |
| `SESSION_SECRET` | Express session secret | - |
| `POSTGRES_*` | Database configuration | - |
| `MINIO_*` | Object storage configuration | - |
| `GOOGLE_CLIENT_ID` | OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | - |

## Project Structure

```
├── frontend/          # Next.js frontend application
├── backend/           # NestJS API server
├── pdf-worker/        # Python PDF parsing service
├── traefik/           # Reverse proxy configuration
├── monitoring/        # Prometheus & Grafana configuration
├── scripts/           # Deployment and utility scripts
├── docs/              # Comprehensive documentation
├── e2e/               # End-to-end tests (Playwright)
├── load-tests/        # Performance testing (k6)
└── SourceFiles/       # Sample UP PDF schedules
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Quick Links
- **[Documentation Index](docs/INDEX.md)** - Complete documentation overview
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Common commands and workflows
- **[Getting Started Guide](docs/guides/getting-started.md)** - Setup and first use
- **[Architecture Overview](docs/architecture/overview.md)** - System design

### Documentation Structure

```
docs/
├── architecture/      # System design and data flow
├── components/        # Service-specific documentation
├── guides/           # User guides and tutorials
├── development/      # Development setup and standards
└── production/       # Production deployment and operations
    ├── deployment/   # Deployment procedures
    ├── backup/       # Backup and recovery
    ├── monitoring/   # Monitoring and alerting
    ├── rollback/     # Rollback procedures
    └── troubleshooting/  # Common issues and solutions
```

### Key Documentation

**Getting Started:**
- [Getting Started Guide](docs/guides/getting-started.md)
- [Quick Reference](docs/QUICK_REFERENCE.md)

**Architecture:**
- [System Overview](docs/architecture/overview.md)
- [Data Flow](docs/architecture/data-flow.md)

**Components:**
- [Frontend Documentation](docs/components/frontend.md)
- [Backend Documentation](docs/components/backend.md)
- [PDF Worker Documentation](docs/components/pdf-worker.md)

**Production:**
- [Production Documentation Index](docs/production/INDEX.md)
- [AWS EC2 Deployment Guide](docs/production/AWS_EC2_DEPLOYMENT_GUIDE.md)
- [Docker Hub Registry Guide](docs/production/DOCKER_HUB_REGISTRY_GUIDE.md)
- [Deployment Runbook](docs/production/DEPLOYMENT_RUNBOOK.md)
- [Backup Guide](docs/production/backup/README.md)
- [Monitoring Guide](docs/production/monitoring/README.md)

**Development:**
- [Development Guide](docs/development/README.md)

See [docs/INDEX.md](docs/INDEX.md) for the complete documentation index.

## Contributing

Contributions are welcome! Please see:
- [Contributing Guide](docs/development/contributing.md)
- [Development Setup](docs/development/setup.md)
- [Code Standards](docs/development/code-standards.md)

## License

Private project - University of Pretoria schedule format specific.
