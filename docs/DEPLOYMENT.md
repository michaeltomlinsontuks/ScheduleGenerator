# Deployment Guide

This guide covers deploying the Tuks Schedule Generator to Fly.io.

## Prerequisites

1. [Fly.io account](https://fly.io/app/sign-up)
2. [Fly CLI installed](https://fly.io/docs/getting-started/installing-flyctl/)
3. Docker Hub account (for CI/CD)
4. Custom domain (optional)

## Architecture on Fly.io

```
┌─────────────────────────────────────────────┐
│                  Fly.io                      │
├─────────────────────────────────────────────┤
│  schedgen-frontend  (tuks-pdf-calendar.co.za)│
│  schedgen-backend   (api.tuks-pdf-calendar.co.za)│
│  schedgen-pdf-worker (internal only)        │
│  schedgen-db        (Fly Postgres)          │
└─────────────────────────────────────────────┘
```

## Initial Setup

### 1. Create Fly Apps

```bash
# Login to Fly.io
fly auth login

# Create apps (run from project root)
fly apps create schedgen-frontend --org personal
fly apps create schedgen-backend --org personal
fly apps create schedgen-pdf-worker --org personal
```

### 2. Create Postgres Database

```bash
fly postgres create --name schedgen-db --region jnb
fly postgres attach schedgen-db --app schedgen-backend
```

### 3. Set Backend Secrets

```bash
fly secrets set \
  SESSION_SECRET="your-secure-session-secret" \
  GOOGLE_CLIENT_ID="your-google-client-id" \
  GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  --app schedgen-backend
```

### 4. Deploy Services

```bash
# Deploy PDF Worker first (no dependencies)
fly deploy --config pdf-worker/fly.toml

# Deploy Backend (depends on PDF Worker)
fly deploy --config backend/fly.toml

# Deploy Frontend (depends on Backend)
fly deploy --config frontend/fly.toml
```

## Custom Domain Setup

### 1. Add Certificates

```bash
# Frontend
fly certs create tuks-pdf-calendar.co.za --app schedgen-frontend

# Backend API
fly certs create api.tuks-pdf-calendar.co.za --app schedgen-backend
```

### 2. Configure DNS

Add these DNS records at your registrar/Cloudflare:

| Type | Name | Value |
|------|------|-------|
| CNAME | @ | schedgen-frontend.fly.dev |
| CNAME | api | schedgen-backend.fly.dev |

### 3. Update Google OAuth

In Google Cloud Console, add authorized redirect URI:
```
https://api.tuks-pdf-calendar.co.za/api/auth/google/callback
```

## CI/CD Pipeline

The GitHub Actions workflow builds and pushes Docker images on every push to `main`:

```yaml
# .github/workflows/docker-build-push.yml
# Builds: michaeltomlinsontuks/schedgen-frontend
#         michaeltomlinsontuks/schedgen-backend
#         michaeltomlinsontuks/schedgen-pdf-worker
```

### Manual Deployment from Docker Hub

```bash
# After CI/CD builds new images
fly deploy --config frontend/fly.toml --image michaeltomlinsontuks/schedgen-frontend:latest
fly deploy --config backend/fly.toml --image michaeltomlinsontuks/schedgen-backend:latest
fly deploy --config pdf-worker/fly.toml --image michaeltomlinsontuks/schedgen-pdf-worker:latest
```

## Configuration Files

### `backend/fly.toml`

```toml
app = "schedgen-backend"
primary_region = "jnb"

[env]
  PORT = "3001"
  NODE_ENV = "production"
  POSTGRES_HOST = "schedgen-db.internal"
  FRONTEND_URL = "https://tuks-pdf-calendar.co.za"
  GOOGLE_CALLBACK_URL = "https://api.tuks-pdf-calendar.co.za/api/auth/google/callback"
  # Semester dates
  FIRST_SEMESTER_START = "2026-02-09"
  FIRST_SEMESTER_END = "2026-05-22"
  SECOND_SEMESTER_START = "2026-07-13"
  SECOND_SEMESTER_END = "2026-10-16"
```

### `frontend/fly.toml`

```toml
app = "schedgen-frontend"
primary_region = "jnb"

[build.args]
  NEXT_PUBLIC_API_URL = "https://api.tuks-pdf-calendar.co.za"
  # Semester dates baked in at build time
  NEXT_PUBLIC_FIRST_SEMESTER_START = "2026-02-09"
  NEXT_PUBLIC_FIRST_SEMESTER_END = "2026-05-22"
  NEXT_PUBLIC_SECOND_SEMESTER_START = "2026-07-13"
  NEXT_PUBLIC_SECOND_SEMESTER_END = "2026-10-16"
```

## Updating Semester Dates

When semester dates change:

1. Update `backend/fly.toml` env vars
2. Update `frontend/fly.toml` build args
3. Redeploy both services:
   ```bash
   fly deploy --config backend/fly.toml
   fly deploy --config frontend/fly.toml
   ```

## Monitoring

### View Logs

```bash
fly logs --app schedgen-backend
fly logs --app schedgen-frontend
fly logs --app schedgen-pdf-worker
```

### Check Status

```bash
fly status --app schedgen-backend
fly status --app schedgen-frontend
fly status --app schedgen-pdf-worker
```

### Health Checks

```bash
curl https://api.tuks-pdf-calendar.co.za/health
curl https://tuks-pdf-calendar.co.za
```

## Scaling

By default, apps scale to zero when idle. For always-on:

```bash
# Set minimum machines
fly scale count 1 --app schedgen-backend
```

Or modify `fly.toml`:
```toml
[http_service]
  min_machines_running = 1
```

## Database Management

### Connect to Database

```bash
fly postgres connect --app schedgen-db
```

### Run Migrations

```bash
# SSH into backend and run migrations
fly ssh console --app schedgen-backend
npm run migration:run:prod
```

## Troubleshooting

### Backend not starting

```bash
# Check logs for errors
fly logs --app schedgen-backend

# Common issues:
# - Missing secrets (GOOGLE_CLIENT_ID, etc.)
# - Database connection issues
# - Missing DATABASE_URL secret
```

### Frontend build fails

```bash
# Ensure build args are set
fly deploy --config frontend/fly.toml --build-arg NEXT_PUBLIC_API_URL=https://api.tuks-pdf-calendar.co.za
```

### OAuth redirect issues

1. Verify `GOOGLE_CALLBACK_URL` matches Google Console
2. Check `FRONTEND_URL` is correct
3. Ensure cookies have `sameSite: 'none'` for cross-origin
