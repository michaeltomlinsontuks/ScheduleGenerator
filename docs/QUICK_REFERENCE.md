# Quick Reference Guide

Fast access to common documentation, commands, and information.

## 🚀 Quick Start

```bash
# Clone and start
git clone <repo>
cd up-schedule-generator
cp .env.example .env
# Edit .env with Google OAuth credentials
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Initialize MinIO
docker exec -it schedgen-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it schedgen-minio mc mb local/pdf-uploads

# Access
open http://localhost:3000
```

## 📚 Documentation Links

| Topic | Link |
|-------|------|
| **Getting Started** | [docs/guides/getting-started.md](./guides/getting-started.md) |
| **Architecture** | [docs/architecture/overview.md](./architecture/overview.md) |
| **API Reference** | [backend/API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md) |
| **Full Index** | [docs/INDEX.md](./INDEX.md) |

## 🔧 Common Commands

### Docker

```bash
# Start all services
docker compose up -d

# Start with dev mode (hot reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Stop all services
docker compose down

# View logs
docker compose logs -f [service]

# Restart service
docker compose restart [service]

# Check status
docker compose ps
```

### Database

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d schedgen

# Run migrations
docker compose exec backend npm run migration:run

# Revert migration
docker compose exec backend npm run migration:revert

# Generate migration
docker compose exec backend npm run migration:generate src/migrations/Name
```

### Backend

```bash
# Run tests
docker compose exec backend npm test

# Run E2E tests
docker compose exec backend npm run test:e2e

# Check coverage
docker compose exec backend npm run test:cov

# Lint code
docker compose exec backend npm run lint
```

### Frontend

```bash
# Run tests
docker compose exec frontend npm test

# Build production
docker compose exec frontend npm run build

# Lint code
docker compose exec frontend npm run lint
```

## 🌐 Service URLs

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | http://localhost:3000 | https://domain.com |
| Backend API | http://localhost:3001 | https://api.domain.com |
| API Docs | http://localhost:3001/api | https://api.domain.com/api |
| Traefik | http://localhost:8081 | N/A |
| MinIO Console | http://localhost:9001 | N/A |
| PostgreSQL | localhost:5433 | Internal only |
| Redis | localhost:6379 | Internal only |

## 📊 System Architecture

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

## 🔑 Environment Variables

### Required
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Optional (with defaults)
```bash
NODE_ENV=development
DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
SESSION_SECRET=change-me-in-production
```

## 📁 Project Structure

```
├── frontend/          # Next.js app
│   ├── src/app/      # Pages
│   ├── src/components/  # React components
│   ├── src/hooks/    # Custom hooks
│   ├── src/services/ # API services
│   └── src/stores/   # Zustand stores
├── backend/          # NestJS API
│   ├── src/auth/     # Authentication
│   ├── src/upload/   # File upload
│   ├── src/jobs/     # Job processing
│   ├── src/parser/   # PDF parsing
│   └── src/calendar/ # Calendar generation
├── pdf-worker/       # Python service
│   ├── app.py        # FastAPI app
│   └── parser/       # PDF parsing logic
└── docs/             # Documentation
```

## 🔍 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check ports are free
lsof -i :3000
lsof -i :3001

# View logs
docker compose logs
```

### OAuth not working
```bash
# Verify credentials in .env
cat .env | grep GOOGLE

# Check redirect URI matches:
# http://localhost:3001/api/auth/google/callback

# Restart backend
docker compose restart backend
```

### PDF upload fails
```bash
# Check MinIO is running
docker compose ps minio

# Check bucket exists
docker exec schedgen-minio mc ls local/

# Create bucket if missing
docker exec schedgen-minio mc mb local/pdf-uploads
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check connection
docker compose exec postgres pg_isready

# Restart PostgreSQL
docker compose restart postgres
```

## 📝 API Endpoints

### Authentication
```
GET  /api/auth/google          # Start OAuth
GET  /api/auth/google/callback # OAuth callback
GET  /api/auth/profile         # Get profile
POST /api/auth/logout          # Logout
```

### Upload
```
POST /api/upload               # Upload PDF
```

### Jobs
```
GET    /api/jobs/:id           # Get status
GET    /api/jobs/:id/result    # Get results
DELETE /api/jobs/:id           # Cancel job
```

### Calendar
```
POST /api/calendar/generate    # Generate ICS
POST /api/calendar/google-sync # Sync to Google
```

### Health
```
GET /api/health                # Overall health
GET /api/health/db             # Database health
GET /api/health/redis          # Redis health
GET /api/health/minio          # MinIO health
```

## 🧪 Testing

### Run all tests
```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# E2E tests
cd e2e && npm test
```

### Test specific file
```bash
# Backend
npm test -- jobs.service.spec.ts

# Frontend
npm test -- eventStore.test.ts

# E2E
npm test -- integration.spec.ts
```

## 🔐 Security Checklist

- [ ] Change SESSION_SECRET in production
- [ ] Use strong POSTGRES_PASSWORD
- [ ] Use strong MINIO_SECRET_KEY
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Keep dependencies updated

## 📦 Deployment

### Production deployment
```bash
# Set environment variables in .env
NODE_ENV=production
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# Deploy
./scripts/deploy.sh

# Or manually
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Health check
```bash
# Check all services
curl http://localhost:3001/api/health

# Should return status: "ok"
```

## 🐛 Debug Mode

### Enable debug logging
```bash
# Backend
LOG_LEVEL=debug docker compose up backend

# PDF Worker
LOG_LEVEL=DEBUG docker compose up pdf-worker
```

### Access logs
```bash
# Backend logs
docker compose logs -f backend

# PDF Worker logs
docker compose logs -f pdf-worker

# All logs
docker compose logs -f
```

## 💾 Backup

### Database backup
```bash
# Manual backup
POSTGRES_PASSWORD=yourpassword ./scripts/backup-db.sh

# Automated (cron)
0 2 * * * cd /path/to/project && POSTGRES_PASSWORD=yourpassword ./scripts/backup-db.sh
```

### Restore database
```bash
# Restore from backup
docker compose exec -T postgres psql -U postgres -d schedgen < backup.sql
```

## 🔄 Updates

### Update dependencies
```bash
# Backend
cd backend && npm update

# Frontend
cd frontend && npm update

# PDF Worker
cd pdf-worker && pip install -U -r requirements.txt
```

### Update Docker images
```bash
# Pull latest images
docker compose pull

# Rebuild
docker compose build

# Restart
docker compose up -d
```

## 📞 Support

### Documentation
- [Full Documentation Index](./INDEX.md)
- [Getting Started Guide](./guides/getting-started.md)
- [Troubleshooting Guide](./guides/troubleshooting.md)
- [FAQ](./guides/faq.md)

### Issues
- Check existing issues on GitHub
- Create new issue with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Logs and screenshots
  - Environment details

## 🎯 Common Tasks

### Add new module color
```typescript
// frontend/src/stores/customizationStore.ts
setModuleColor('COS 214', '#FF6B6B');
```

### Change semester dates
```typescript
// frontend/src/stores/customizationStore.ts
setSemesterDates({
  start: '2025-01-20',
  end: '2025-05-30'
});
```

### Clear all data
```bash
# Stop and remove volumes
docker compose down -v

# Restart
docker compose up -d

# Reinitialize MinIO
docker exec -it schedgen-minio mc mb local/pdf-uploads
```

## 📈 Performance

### Monitor resource usage
```bash
# Docker stats
docker stats

# Service-specific
docker stats schedgen-backend
```

### Optimize database
```bash
# Vacuum database
docker compose exec postgres psql -U postgres -d schedgen -c "VACUUM ANALYZE;"

# Reindex
docker compose exec postgres psql -U postgres -d schedgen -c "REINDEX DATABASE schedgen;"
```

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Docker Docs](https://docs.docker.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Google Calendar API](https://developers.google.com/calendar)

---

**Last Updated**: November 28, 2024  
**Version**: 1.0.0
