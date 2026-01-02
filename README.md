# Tuks Schedule Generator

Convert University of Pretoria class schedule PDFs into Google Calendar events.

🌐 **Live at**: [tuks-pdf-calendar.co.za](https://tuks-pdf-calendar.co.za)

## What It Does

1. **Upload** your UP timetable PDF
2. **Preview** extracted classes with customizable colours
3. **Sync** directly to Google Calendar with one click

🔒 **Privacy-first**: PDFs are deleted immediately after processing. No data stored.

## How It Works

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│    Frontend    │────▶│    Backend     │────▶│   PDF Worker   │
│   (Next.js)    │     │   (NestJS)     │     │   (FastAPI)    │
│                │     │                │     │   pdfplumber   │
└────────────────┘     └────────────────┘     └────────────────┘
        │                      │
        │                      ▼
        │              Google Calendar API
        │              (OAuth 2.0)
        ▼
   User's Browser
   (Zustand state)
```

**Flow:**
1. User uploads PDF → Frontend sends to Backend
2. Backend forwards to PDF Worker for parsing
3. Extracted events returned to browser (stored in Zustand, not on server)
4. User authenticates with Google OAuth
5. Events synced to Google Calendar via API

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TailwindCSS, DaisyUI |
| Backend | NestJS (stateless) |
| PDF Parser | Python FastAPI, pdfplumber |
| Hosting | Fly.io (containerized) |
| Auth | Google OAuth 2.0 |

## Project Structure

```
ScheduleGenerator/
├── frontend/       # Next.js app
├── backend/        # NestJS API
├── pdf-worker/     # Python PDF parsing
└── docs/           # Architecture & deployment guides
```

## Development

```bash
# Clone and setup
git clone https://github.com/michaeltomlinsontuks/ScheduleGenerator.git
cd ScheduleGenerator

# Run with Docker
docker compose up

# Or run individually
cd frontend && npm run dev      # Port 3000
cd backend && npm run start:dev # Port 3001
cd pdf-worker && uvicorn main:app --port 5001
```
## License

[MIT](LICENSE)
