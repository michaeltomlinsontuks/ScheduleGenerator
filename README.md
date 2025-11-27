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
   - Traefik Dashboard: http://traefik.localhost:8080
   - MinIO Console: http://localhost:9001

### Development Features

- Hot reload enabled for frontend and backend
- All service ports exposed for debugging
- Volume mounts for live code changes

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 3001 |
| PDF Worker | 5000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

## Production Deployment

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

### Production Features

- TLS certificates via Let's Encrypt
- Security headers middleware
- Rate limiting on API endpoints
- Health checks on all services
- No exposed ports except 80/443

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
| `scripts/init-minio.sh` | Initialize MinIO bucket |
| `scripts/backup-db.sh` | Backup PostgreSQL with 7-day retention |

### Database Backup

```bash
# Manual backup
POSTGRES_PASSWORD=yourpassword ./scripts/backup-db.sh

# Automated via cron (daily at 2 AM)
0 2 * * * cd /path/to/project && POSTGRES_PASSWORD=yourpassword ./scripts/backup-db.sh
```

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
├── scripts/           # Deployment and utility scripts
├── SourceFiles/       # Sample UP PDF schedules
├── V1/                # Legacy CLI version (deprecated)
├── V2/                # CLI version with Google Calendar API
└── docs/              # Additional documentation
```

## Legacy CLI Versions

The `V1/` and `V2/` directories contain standalone Python CLI tools for PDF-to-calendar conversion. See [V2/README.md](V2/README.md) for CLI usage.

## License

Private project - University of Pretoria schedule format specific.
