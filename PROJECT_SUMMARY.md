# University of Pretoria Schedule Generator - Project Summary

## Overview

This is a Python-based tool that converts University of Pretoria (UP) class schedule PDFs into Google Calendar events. The project has two versions:

- **V1**: A prototype with limited functionality (Excel-based workflow, incomplete PDF parsing)
- **V2**: A complete rebuild with direct PDF parsing and Google Calendar API integration (current/active version)

## Core Problem Solved

UP provides student schedules as PDF files containing tables with class information. Manually entering these into Google Calendar is tedious and error-prone. This tool automates the conversion process.

## V2 Architecture (Current Version)

### Input Files
- **Weekly Schedule PDFs** (`UP_MOD_XLS.pdf`): Contains recurring lecture/tutorial schedules with columns: Module, Activity, Group, Day, Time, Venue
- **Test Schedule PDFs** (`UP_TST_PDF.pdf`): Contains one-time test events with columns: Module, Test, Date, Time, Venue

### Core Modules

| Module | Purpose |
|--------|---------|
| `main.py` | CLI entry point, orchestrates the workflow |
| `pdf_parser.py` | Extracts table data from UP PDFs using pdfplumber |
| `data_processor.py` | Cleans/validates extracted data, standardizes formats |
| `calendar_generator.py` | Creates .ics calendar files (alternative to API) |
| `preview_generator.py` | Generates human-readable preview before committing |
| `google_calendar_client.py` | Google Calendar API integration (OAuth, event creation) |
| `config.py` | Semester dates, module colors, API configuration |
| `utils.py` | Helper functions (PDF type detection) |

### Data Flow

```
PDF File → pdf_parser.py → Raw Events List
                              ↓
                        data_processor.py → Cleaned Events
                              ↓
                        preview_generator.py → User Approval
                              ↓
                        google_calendar_client.py → Google Calendar
```

### Key Features

1. **Dual PDF Format Support**: Handles both weekly recurring schedules and one-time test schedules
2. **Automatic PDF Type Detection**: Scans PDF content for keywords ("Lectures" vs "Semester Tests")
3. **Google Calendar API Integration**: Direct event creation (no manual .ics import needed)
4. **Color-Coding**: Assigns specific colors to different modules (configurable in `config.py`)
5. **Recurring Events**: Weekly events automatically repeat for the semester duration
6. **Mandatory Preview**: Shows all events before adding to calendar (prevents mass import errors)
7. **Persistent OAuth**: One-time Google authentication, token stored in `token.pickle`

## Configuration

### Semester Dates (`config.py`)
```python
SEMESTER_START_DATE = datetime(2025, 7, 21)
SEMESTER_END_DATE = datetime(2025, 11, 14)
```

### Module Colors (`config.py`)
```python
MODULE_COLORS = {
    "COS 214": "Tangerine",
    "COS 226": "Basil",
    "COS 284": "Flamingo",
    "STK 220": "Banana",
    "WTW 285": "Grape",
    "Default": "Graphite"
}
```

Available colors: Lavender, Sage, Grape, Flamingo, Banana, Tangerine, Peacock, Graphite, Blueberry, Basil, Default

## PDF Parsing Details

### Weekly Schedule Structure
- Headers: Module, Offered, Activity, Group, Lang, Day, Time, Venue
- Multi-line cells handled (e.g., multiple days/times per row)
- Forward-fills empty cells for Module, Offered, Group, Lang columns

### Test Schedule Structure
- Headers: Module, Test, Date, Time, Venue
- Single-occurrence events (no recurrence)
- Date format: "DD Mon YYYY" (e.g., "15 Aug 2025")

### Time Format
- Standard: `HH:MM - HH:MM` (e.g., "08:30 - 10:20")
- Parsed into separate `start_time` and `end_time` fields

## Google Calendar Integration

### Setup Requirements
1. Google Cloud Console project with Calendar API enabled
2. OAuth 2.0 credentials (`credentials.json`) in V2 directory
3. Test user added to OAuth consent screen

### Authentication Flow
1. First run opens browser for Google login
2. User grants calendar access permission
3. Token saved to `token.pickle` for future runs

### Event Creation
- Events added to primary calendar
- Includes: summary, location, start/end times, recurrence rule, color
- Rate-limited (100ms delay between API calls)

## Dependencies

```
pdfplumber          # PDF table extraction
icalendar           # .ics file generation
pandas              # Data manipulation
pytz                # Timezone handling (Africa/Johannesburg)
google-api-python-client  # Google Calendar API
google-auth-oauthlib      # OAuth authentication
```

## Usage

```bash
cd V2
source venv/bin/activate
python main.py
# Enter PDF path when prompted
# Review preview
# Type 'yes' to add events to Google Calendar
```

## V1 vs V2 Comparison

| Feature | V1 | V2 |
|---------|----|----|
| PDF Parsing | Basic/incomplete | Robust table extraction |
| Excel Conversion | Manual required | Not needed |
| Calendar Output | .ics file only | Direct Google Calendar API |
| Preview | Basic | Mandatory with approval |
| Color Coding | None | Per-module colors |
| Error Handling | Minimal | Comprehensive |
| User Interface | Hardcoded paths | Interactive CLI |

## Known Limitations

- Designed specifically for UP's PDF format (not generic)
- Requires manual Google Cloud Console setup for API credentials
- No GUI (CLI only)
- No duplicate event detection (will create duplicates if run multiple times)

## File Structure

```
ScheduleGenerator/
├── SourceFiles/           # Sample UP PDF schedules
│   ├── UP_MOD_XLS.pdf    # Weekly schedule sample
│   └── UP_TST_PDF.pdf    # Test schedule sample
├── V1/                    # Prototype (deprecated)
├── V2/                    # Current version
│   ├── main.py           # Entry point
│   ├── pdf_parser.py     # PDF extraction
│   ├── data_processor.py # Data cleaning
│   ├── calendar_generator.py  # .ics generation
│   ├── preview_generator.py   # Preview system
│   ├── google_calendar_client.py  # Google API
│   ├── config.py         # Configuration
│   ├── utils.py          # Helpers
│   ├── credentials.json  # Google OAuth (user-provided)
│   ├── token.pickle      # Stored auth token
│   └── requirements.txt  # Dependencies
└── LLM_DEVELOPMENT_PROMPT.md  # Original development spec
```

## Timezone

All events use `Africa/Johannesburg` timezone (South African Standard Time, UTC+2).

## Future Enhancement Ideas

- Duplicate event detection/prevention
- GUI interface
- Support for additional UP PDF formats
- Calendar sync (update existing events)
- Holiday/break exclusion
- Multiple calendar support
