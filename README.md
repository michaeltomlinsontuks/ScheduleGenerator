# Tuks Schedule Generator

A web application that converts University of Pretoria class schedule PDFs into Google Calendar events. Upload your PDF, preview the extracted events, customize colors and date ranges, and sync directly to your Google Calendar.

🌐 **Live at**: [tuks-pdf-calendar.co.za](https://tuks-pdf-calendar.co.za)

## Features

- 📄 **PDF Upload** - Upload your UP timetable PDF
- 👁️ **Preview Events** - Review extracted classes before syncing
- 🎨 **Module Colors** - Customize colors for each module
- 📅 **Date Range Selection** - Set semester start/end dates
- 🔄 **Google Calendar Sync** - One-click sync to your calendar
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

| Service | Technology |
|---------|------------|
| Frontend | Next.js 16, React 19, TailwindCSS, DaisyUI |
| Backend | NestJS 11, TypeORM, PostgreSQL |
| PDF Worker | Python FastAPI, pdfplumber |
| Hosting | Fly.io (3 services) |
| Database | Fly Postgres |
| CI/CD | GitHub Actions → Docker Hub → Fly.io |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Fly.io Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────┐ │
│  │  schedgen-       │   │  schedgen-       │   │  schedgen-   │ │
│  │  frontend        │──▶│  backend         │──▶│  pdf-worker  │ │
│  │  (Next.js)       │   │  (NestJS)        │   │  (FastAPI)   │ │
│  │                  │   │                  │   │              │ │
│  │  Port: 3000      │   │  Port: 3001      │   │  Port: 5001  │ │
│  └──────────────────┘   └────────┬─────────┘   └──────────────┘ │
│                                  │                               │
│                                  ▼                               │
│                         ┌──────────────────┐                     │
│                         │  schedgen-db     │                     │
│                         │  (Fly Postgres)  │                     │
│                         └──────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Domains:
  - Frontend: tuks-pdf-calendar.co.za
  - Backend API: api.tuks-pdf-calendar.co.za
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Google Cloud Console project with Calendar API enabled

### 1. Clone and Setup

```bash
git clone https://github.com/michaeltomlinsontuks/ScheduleGenerator.git
cd ScheduleGenerator
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your Google OAuth credentials:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### 3. Start Services

**Option A: Docker Compose (Recommended)**
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Option B: Run Services Individually**
```bash
# Terminal 1 - Backend
cd backend && npm install && npm run start:dev

# Terminal 2 - Frontend  
cd frontend && npm install && npm run dev

# Terminal 3 - PDF Worker
cd pdf-worker && pip install -r requirements.txt && uvicorn main:app --port 5001
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |

## Project Structure

```
ScheduleGenerator/
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/        # Next.js App Router pages
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API service layer
│   │   └── stores/     # Zustand state stores
│   └── fly.toml        # Fly.io deployment config
│
├── backend/            # NestJS API server
│   ├── src/
│   │   ├── auth/       # Google OAuth authentication
│   │   ├── calendar/   # Google Calendar integration
│   │   ├── upload/     # PDF upload handling
│   │   ├── parser/     # PDF parsing coordination
│   │   └── health/     # Health check endpoints
│   └── fly.toml        # Fly.io deployment config
│
├── pdf-worker/         # Python PDF parsing service
│   ├── main.py         # FastAPI application
│   ├── parser.py       # PDF parsing logic
│   └── fly.toml        # Fly.io deployment config
│
├── SourceFiles/        # Sample UP timetable PDFs
├── docs/               # Documentation
└── .github/workflows/  # CI/CD pipeline
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Enable **Google Calendar API**
4. Configure OAuth consent screen:
   - Add test users during development
   - Scopes: `calendar.events`, `userinfo.email`, `userinfo.profile`
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - Dev: `http://localhost:3001/api/auth/google/callback`
     - Prod: `https://api.tuks-pdf-calendar.co.za/api/auth/google/callback`

## Deployment

The application is deployed on [Fly.io](https://fly.io) with three separate apps:

```bash
# Deploy all services
fly deploy --config frontend/fly.toml
fly deploy --config backend/fly.toml  
fly deploy --config pdf-worker/fly.toml
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/docker-build-push.yml`) automatically:
1. Builds Docker images for all services
2. Pushes to Docker Hub (`michaeltomlinsontuks/schedgen-*`)
3. Images can be deployed to Fly.io manually or via `fly deploy`

## Environment Variables

### Backend (`backend/fly.toml`)
| Variable | Description |
|----------|-------------|
| `POSTGRES_HOST` | Database host (Fly internal DNS) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `FIRST_SEMESTER_START/END` | Semester date defaults |
| `SECOND_SEMESTER_START/END` | Semester date defaults |

### Frontend (`frontend/fly.toml`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_*_SEMESTER_*` | Semester date defaults |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [Deployment](docs/DEPLOYMENT.md) - Fly.io deployment guide
- [Google OAuth Guide](docs/production/GOOGLE_OAUTH_VERIFICATION_GUIDE.md) - OAuth setup details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Private project - University of Pretoria schedule format specific.
