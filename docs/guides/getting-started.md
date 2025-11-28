# Getting Started Guide

Complete guide to setting up and using the UP Schedule Generator.

## Prerequisites

### Required Software
- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **Git** for cloning the repository
- **Google Cloud Console** account (for OAuth)

### System Requirements
- **OS**: macOS, Linux, or Windows with WSL2
- **RAM**: Minimum 4GB, recommended 8GB
- **Disk**: 5GB free space
- **Network**: Internet connection for Docker images and OAuth

## Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone <repository-url>
cd up-schedule-generator
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your Google OAuth credentials
nano .env
```

Minimum required configuration:
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Start Services

```bash
# Start all services in development mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Wait for services to be healthy (30-60 seconds)
docker compose ps
```

### 4. Initialize Storage

```bash
# Create MinIO bucket (first time only)
docker exec -it schedgen-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it schedgen-minio mc mb local/pdf-uploads
```

### 5. Access Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: "UP Schedule Generator"
4. Click "Create"

### Step 2: Enable Calendar API

1. In the project dashboard, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in required fields:
   - **App name**: UP Schedule Generator
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click "Save and Continue"
5. Add scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
6. Click "Save and Continue"
7. Add test users (your email address)
8. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Configure:
   - **Name**: UP Schedule Generator
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:3001`
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/auth/google/callback`
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### Step 5: Update Environment Variables

```bash
# Edit .env file
nano .env

# Add your credentials
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### Step 6: Restart Backend

```bash
docker compose restart backend
```

## Using the Application

### Step 1: Upload PDF

1. Navigate to http://localhost:3000
2. Click "Get Started" or "Upload Schedule"
3. Select your UP schedule PDF file
4. Choose PDF type:
   - **Weekly**: Regular lecture/tutorial schedules
   - **Test**: Semester test schedules
   - **Exam**: Examination schedules
5. Click "Upload"

### Step 2: Monitor Processing

The application will automatically:
- Upload your PDF to secure storage
- Queue the processing job
- Parse the PDF tables
- Extract event data
- Navigate to preview when complete

Processing typically takes 5-15 seconds.

### Step 3: Preview Events

Review the extracted events:
- Events are grouped by day
- Each event shows:
  - Module code
  - Activity type (Lecture, Tutorial, Practical)
  - Time
  - Venue
  - Group
- Select/deselect events to include
- Filter by module

### Step 4: Customize

Click "Customize" to personalize your calendar:

**Module Colors**:
- Assign colors to each module
- Colors will appear in your calendar

**Semester Dates**:
- Set semester start date
- Set semester end date
- Recurring events will repeat within this range

**Event Details**:
- Edit event titles
- Add custom notes
- Modify locations

### Step 5: Generate Calendar

Choose your preferred method:

**Option A: Download ICS File**
1. Click "Download ICS"
2. Save the file
3. Import into any calendar app:
   - Google Calendar: Settings → Import & Export
   - Apple Calendar: File → Import
   - Outlook: File → Import

**Option B: Sync to Google Calendar**
1. Click "Add to Google Calendar"
2. Sign in with Google (first time only)
3. Grant calendar permissions
4. Events will be added automatically

## Verification

### Check Services are Running

```bash
# View all services
docker compose ps

# Should show all services as "healthy"
NAME                STATUS
schedgen-frontend   Up (healthy)
schedgen-backend    Up (healthy)
schedgen-pdf-worker Up (healthy)
schedgen-postgres   Up (healthy)
schedgen-redis      Up (healthy)
schedgen-minio      Up (healthy)
schedgen-traefik    Up (healthy)
```

### Check Logs

```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs frontend
docker compose logs backend
docker compose logs pdf-worker

# Follow logs in real-time
docker compose logs -f backend
```

### Test Backend API

```bash
# Health check
curl http://localhost:3001/api/health

# Should return:
{
  "status": "ok",
  "info": {
    "database": {"status": "up"},
    "redis": {"status": "up"},
    "minio": {"status": "up"}
  }
}
```

### Test Frontend

```bash
# Open in browser
open http://localhost:3000

# Should see homepage with "Upload Schedule" button
```

## Troubleshooting

### Services Won't Start

**Issue**: Port already in use
```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Stop conflicting service or change port in .env
```

**Issue**: Docker daemon not running
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker
```

### OAuth Not Working

**Issue**: Redirect URI mismatch
```
Error: redirect_uri_mismatch
```

**Solution**: Ensure redirect URI in Google Console matches exactly:
```
http://localhost:3001/api/auth/google/callback
```

**Issue**: Invalid client error
```
Error: invalid_client
```

**Solution**: Check credentials in `.env`:
```bash
# Verify these match Google Console
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### PDF Upload Fails

**Issue**: File too large
```
Error: File size exceeds maximum (10MB)
```

**Solution**: Compress PDF or split into multiple files

**Issue**: Invalid PDF format
```
Error: Invalid PDF file
```

**Solution**: Ensure file is a valid PDF (not image or other format)

### No Events Extracted

**Issue**: PDF format not recognized
```
Error: No tables found in PDF
```

**Solution**: 
- Verify PDF is from UP (correct format)
- Check PDF type selection (weekly/test/exam)
- Try different PDF type

### Database Connection Failed

**Issue**: Cannot connect to database
```
Error: Connection refused
```

**Solution**:
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker compose logs postgres
```

## Development Mode

### Hot Reload

Development mode enables hot reload for faster development:

```bash
# Start in development mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Changes to code will automatically reload:
# - Frontend: Next.js fast refresh
# - Backend: NestJS watch mode
# - PDF Worker: Uvicorn reload
```

### Access Development Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Frontend | http://localhost:3000 | Web application |
| Backend API | http://localhost:3001 | REST API |
| API Docs | http://localhost:3001/api | Swagger documentation |
| Traefik Dashboard | http://localhost:8081 | Reverse proxy dashboard |
| MinIO Console | http://localhost:9001 | Object storage UI |
| PostgreSQL | localhost:5433 | Database (use client) |
| Redis | localhost:6379 | Cache/Queue (use client) |

### Database Access

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d schedgen

# Run queries
SELECT * FROM jobs;
SELECT * FROM sessions;

# Exit
\q
```

### Redis Access

```bash
# Connect to Redis
docker compose exec redis redis-cli

# View keys
KEYS *

# Get job data
GET bull:pdf-processing:*

# Exit
exit
```

### MinIO Access

1. Open http://localhost:9001
2. Login:
   - **Username**: minioadmin
   - **Password**: minioadmin
3. Browse buckets and files

## Next Steps

### For Users
- [Upload Your First Schedule](./uploading-pdfs.md)
- [Customize Your Calendar](./customization.md)
- [Troubleshooting Guide](./troubleshooting.md)

### For Developers
- [Development Setup](../development/setup.md)
- [Architecture Overview](../architecture/overview.md)
- [API Documentation](../../backend/API_DOCUMENTATION.md)
- [Contributing Guide](../development/contributing.md)

## Support

### Common Questions
- See [FAQ](./faq.md)
- Check [Troubleshooting Guide](./troubleshooting.md)

### Report Issues
- Check existing issues on GitHub
- Create new issue with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Logs and screenshots
  - Environment details

## Clean Up

### Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (deletes data)
docker compose down -v
```

### Remove Images

```bash
# Remove project images
docker compose down --rmi all

# Remove all unused Docker resources
docker system prune -a
```

## Summary

You should now have:
- ✅ All services running and healthy
- ✅ Google OAuth configured
- ✅ MinIO bucket initialized
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend API accessible at http://localhost:3001
- ✅ Ability to upload and process PDFs
- ✅ Calendar generation working

If you encounter any issues, refer to the [Troubleshooting Guide](./troubleshooting.md) or check the logs.
