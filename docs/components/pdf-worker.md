# PDF Worker Component Documentation

Python FastAPI service for parsing University of Pretoria PDF schedules.

## Overview

The PDF Worker is a specialized Python service that extracts structured data from UP schedule PDFs. It uses pdfplumber for table extraction and provides a REST API for the backend to consume.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | 0.104.x | Web framework |
| pdfplumber | 0.10.x | PDF parsing |
| pandas | 2.1.x | Data manipulation |
| uvicorn | 0.24.x | ASGI server |

## Project Structure

```
pdf-worker/
├── app.py                  # FastAPI application
├── parser/
│   ├── __init__.py
│   ├── pdf_parser.py      # PDF table extraction
│   ├── data_processor.py  # Data cleaning and validation
│   └── utils.py           # Utility functions
├── fixtures/              # Test fixtures and generators
│   ├── generate_fixtures.py
│   ├── verify_fixtures.py
│   └── sample_tables.py
├── requirements.txt       # Python dependencies
└── Dockerfile            # Container definition
```

## Core Components

### 1. FastAPI Application
**Location**: `app.py`

Main application entry point with API endpoints.

#### Endpoints

```python
POST /parse              # Parse PDF file
GET  /health            # Health check
GET  /                  # API info
```

#### Parse Endpoint

**Request**:
```http
POST /parse
Content-Type: multipart/form-data

file: <PDF binary data>
pdf_type: "weekly" | "test" | "exam"
```

**Response**:
```json
{
  "success": true,
  "pdf_type": "weekly",
  "events": [
    {
      "Module": "COS 214",
      "Activity": "L1",
      "Group": "G01",
      "Day": "Monday",
      "start_time": "08:30",
      "end_time": "09:20",
      "Venue": "Centenary 6"
    }
  ],
  "total_events": 44,
  "processing_time_ms": 1234
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "PDF_PARSE_ERROR",
  "message": "Failed to extract tables from PDF",
  "details": {
    "page": 1,
    "reason": "No tables found"
  }
}
```

### 2. PDF Parser
**Location**: `parser/pdf_parser.py`

Extracts table data from PDF files using pdfplumber.

#### Key Functions

```python
def extract_tables_from_pdf(pdf_path: str, pdf_type: str) -> List[Dict]:
    """
    Extract tables from PDF file.
    
    Args:
        pdf_path: Path to PDF file
        pdf_type: Type of PDF (weekly, test, exam)
    
    Returns:
        List of dictionaries containing event data
    
    Raises:
        PDFParseError: If PDF cannot be parsed
    """
```

#### Parsing Strategy

**Weekly Schedule PDFs**:
```python
# Expected columns
columns = [
    "Module",
    "Offered",
    "Activity",
    "Group",
    "Lang",
    "Day",
    "Time",
    "Venue"
]

# Table extraction settings
table_settings = {
    "vertical_strategy": "lines",
    "horizontal_strategy": "lines",
    "snap_tolerance": 3,
    "join_tolerance": 3,
    "edge_min_length": 50
}
```

**Test/Exam Schedule PDFs**:
```python
# Expected columns
columns = [
    "Module",
    "Test",
    "Date",
    "Time",
    "Venue"
]

# Different extraction strategy for test schedules
table_settings = {
    "vertical_strategy": "text",
    "horizontal_strategy": "lines",
    "snap_tolerance": 5
}
```

#### Multi-Page Handling

```python
def extract_from_all_pages(pdf_path: str) -> List[Dict]:
    """Extract tables from all pages of PDF."""
    all_events = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            try:
                tables = page.extract_tables(table_settings)
                events = process_tables(tables, page_num)
                all_events.extend(events)
            except Exception as e:
                logger.warning(f"Failed to parse page {page_num}: {e}")
                continue
    
    return all_events
```

### 3. Data Processor
**Location**: `parser/data_processor.py`

Cleans and validates extracted data.

#### Data Cleaning

```python
def clean_event_data(raw_event: Dict) -> Dict:
    """
    Clean and standardize event data.
    
    Transformations:
    - Trim whitespace
    - Standardize day names
    - Parse time ranges
    - Validate module codes
    - Clean venue names
    """
    return {
        "Module": clean_module_code(raw_event["Module"]),
        "Activity": clean_activity_type(raw_event["Activity"]),
        "Group": clean_group_name(raw_event["Group"]),
        "Day": standardize_day_name(raw_event["Day"]),
        "start_time": parse_start_time(raw_event["Time"]),
        "end_time": parse_end_time(raw_event["Time"]),
        "Venue": clean_venue_name(raw_event["Venue"])
    }
```

#### Time Parsing

```python
def parse_time_range(time_str: str) -> Tuple[str, str]:
    """
    Parse time range string.
    
    Examples:
        "08:30 - 09:20" → ("08:30", "09:20")
        "14:00-15:50"   → ("14:00", "15:50")
        "8:30-9:20"     → ("08:30", "09:20")
    
    Returns:
        Tuple of (start_time, end_time) in HH:MM format
    """
    # Remove spaces and split on dash
    time_str = time_str.replace(" ", "")
    start, end = time_str.split("-")
    
    # Pad single digit hours
    start = start.zfill(5)  # "8:30" → "08:30"
    end = end.zfill(5)
    
    return start, end
```

#### Day Name Standardization

```python
def standardize_day_name(day: str) -> str:
    """
    Standardize day names.
    
    Examples:
        "Mon" → "Monday"
        "monday" → "Monday"
        "MONDAY" → "Monday"
    """
    day_mapping = {
        "mon": "Monday",
        "tue": "Tuesday",
        "wed": "Wednesday",
        "thu": "Thursday",
        "fri": "Friday",
        "sat": "Saturday",
        "sun": "Sunday"
    }
    
    day_lower = day.lower()[:3]
    return day_mapping.get(day_lower, day.capitalize())
```

#### Module Code Validation

```python
def validate_module_code(module: str) -> bool:
    """
    Validate UP module code format.
    
    Valid formats:
        - COS 214
        - STK 220
        - WTW 285
        - SCI 101
    
    Pattern: 3 letters, space, 3 digits
    """
    import re
    pattern = r'^[A-Z]{3}\s\d{3}$'
    return bool(re.match(pattern, module))
```

### 4. Utilities
**Location**: `parser/utils.py`

Helper functions for PDF processing.

```python
def detect_pdf_type(pdf_path: str) -> str:
    """
    Auto-detect PDF type by scanning content.
    
    Detection rules:
    - Contains "Lectures" or "Tutorials" → weekly
    - Contains "Semester Tests" → test
    - Contains "Examinations" → exam
    """
    with pdfplumber.open(pdf_path) as pdf:
        first_page_text = pdf.pages[0].extract_text().lower()
        
        if "semester test" in first_page_text:
            return "test"
        elif "examination" in first_page_text:
            return "exam"
        else:
            return "weekly"

def merge_split_cells(table: List[List[str]]) -> List[List[str]]:
    """
    Merge cells that were split across rows.
    
    Handles cases where module info spans multiple rows.
    """
    merged = []
    current_row = None
    
    for row in table:
        if row[0]:  # New module
            if current_row:
                merged.append(current_row)
            current_row = row
        else:  # Continuation of previous module
            if current_row:
                # Merge with previous row
                for i, cell in enumerate(row):
                    if cell and not current_row[i]:
                        current_row[i] = cell
    
    if current_row:
        merged.append(current_row)
    
    return merged
```

## PDF Format Support

### Weekly Schedule Format

**Expected Structure**:
```
┌─────────┬─────────┬──────────┬───────┬──────┬────────┬──────────┬─────────┐
│ Module  │ Offered │ Activity │ Group │ Lang │ Day    │ Time     │ Venue   │
├─────────┼─────────┼──────────┼───────┼──────┼────────┼──────────┼─────────┤
│ COS 214 │ S1      │ L1       │ G01   │ E    │ Monday │ 08:30-   │ Cent 6  │
│         │         │          │       │      │        │ 09:20    │         │
├─────────┼─────────┼──────────┼───────┼──────┼────────┼──────────┼─────────┤
│ COS 214 │ S1      │ P1       │ G01   │ E    │ Tue    │ 14:30-   │ IT 3-2  │
│         │         │          │       │      │        │ 16:20    │         │
└─────────┴─────────┴──────────┴───────┴──────┴────────┴──────────┴─────────┘
```

**Parsing Logic**:
1. Extract table using pdfplumber
2. Identify header row
3. Forward-fill empty cells (module, offered, group, lang)
4. Parse time ranges
5. Clean and validate data

### Test Schedule Format

**Expected Structure**:
```
┌─────────┬──────────────┬────────────┬──────────┬─────────┐
│ Module  │ Test         │ Date       │ Time     │ Venue   │
├─────────┼──────────────┼────────────┼──────────┼─────────┤
│ COS 214 │ Semester 1   │ 15 Aug 25  │ 08:30-   │ Cent 6  │
│         │              │            │ 10:30    │         │
├─────────┼──────────────┼────────────┼──────────┼─────────┤
│ STK 220 │ Semester 1   │ 22 Aug 25  │ 14:00-   │ IT 1-1  │
│         │              │            │ 16:00    │         │
└─────────┴──────────────┴────────────┴──────────┴─────────┘
```

**Parsing Logic**:
1. Extract table
2. Parse date (DD Mon YY format)
3. Parse time range
4. Mark as non-recurring event

### Exam Schedule Format

Similar to test schedule but with "Examination" keyword.

## Error Handling

### Exception Types

```python
class PDFParseError(Exception):
    """Raised when PDF cannot be parsed."""
    pass

class TableExtractionError(PDFParseError):
    """Raised when tables cannot be extracted."""
    pass

class DataValidationError(PDFParseError):
    """Raised when extracted data is invalid."""
    pass
```

### Error Recovery

```python
def parse_with_fallback(pdf_path: str, pdf_type: str) -> List[Dict]:
    """
    Parse PDF with fallback strategies.
    
    Strategy 1: Line-based table detection
    Strategy 2: Text-based table detection
    Strategy 3: Manual column detection
    """
    strategies = [
        {"vertical_strategy": "lines", "horizontal_strategy": "lines"},
        {"vertical_strategy": "text", "horizontal_strategy": "lines"},
        {"vertical_strategy": "text", "horizontal_strategy": "text"}
    ]
    
    for i, settings in enumerate(strategies, 1):
        try:
            logger.info(f"Trying strategy {i}")
            events = extract_tables(pdf_path, settings)
            if events:
                return events
        except Exception as e:
            logger.warning(f"Strategy {i} failed: {e}")
            continue
    
    raise PDFParseError("All parsing strategies failed")
```

## Testing

### Test Fixtures
**Location**: `fixtures/`

Generated test PDFs for different scenarios.

```python
# Generate test fixtures
python fixtures/generate_fixtures.py

# Verify fixtures
python fixtures/verify_fixtures.py
```

### Unit Tests

```python
def test_parse_weekly_schedule():
    """Test parsing weekly schedule PDF."""
    events = parse_pdf("fixtures/lecture-schedule.pdf", "weekly")
    
    assert len(events) > 0
    assert all("Module" in e for e in events)
    assert all("Day" in e for e in events)
    assert all("start_time" in e for e in events)

def test_parse_test_schedule():
    """Test parsing test schedule PDF."""
    events = parse_pdf("fixtures/test-schedule.pdf", "test")
    
    assert len(events) > 0
    assert all("Date" in e for e in events)
    assert all("Module" in e for e in events)

def test_time_parsing():
    """Test time range parsing."""
    start, end = parse_time_range("08:30 - 09:20")
    assert start == "08:30"
    assert end == "09:20"
    
    start, end = parse_time_range("8:30-9:20")
    assert start == "08:30"
    assert end == "09:20"
```

## Performance Optimization

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def parse_pdf_cached(pdf_hash: str, pdf_type: str) -> List[Dict]:
    """Cache parsed results by PDF hash."""
    return parse_pdf(pdf_hash, pdf_type)
```

### Parallel Processing

```python
from concurrent.futures import ThreadPoolExecutor

def parse_multiple_pages(pdf_path: str) -> List[Dict]:
    """Parse multiple pages in parallel."""
    with pdfplumber.open(pdf_path) as pdf:
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(parse_page, page)
                for page in pdf.pages
            ]
            results = [f.result() for f in futures]
    
    return [event for page_events in results for event in page_events]
```

## Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pdf-worker.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Usage
logger.info(f"Parsing PDF: {filename}")
logger.warning(f"Failed to parse page {page_num}")
logger.error(f"PDF parse error: {error}")
```

## Environment Variables

```bash
# Server
HOST=0.0.0.0
PORT=5000
WORKERS=4

# Logging
LOG_LEVEL=INFO
LOG_FILE=pdf-worker.log

# Performance
MAX_FILE_SIZE=10485760  # 10MB
TIMEOUT=30  # seconds
```

## Build and Deployment

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

### Production

```bash
# Run with gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
```

## API Usage Examples

### cURL

```bash
# Parse PDF
curl -X POST http://localhost:5000/parse \
  -F "file=@schedule.pdf" \
  -F "pdf_type=weekly"

# Health check
curl http://localhost:5000/health
```

### Python

```python
import requests

# Parse PDF
with open("schedule.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:5000/parse",
        files={"file": f},
        data={"pdf_type": "weekly"}
    )
    
result = response.json()
print(f"Parsed {result['total_events']} events")
```

### TypeScript (Backend)

```typescript
const formData = new FormData();
formData.append('file', pdfBuffer, 'schedule.pdf');
formData.append('pdf_type', 'weekly');

const response = await axios.post(
  'http://pdf-worker:5000/parse',
  formData,
  {
    headers: { 'Content-Type': 'multipart/form-data' }
  }
);

const events = response.data.events;
```

## Troubleshooting

### Common Issues

**Issue**: No tables found in PDF
```python
# Solution: Adjust table detection settings
table_settings = {
    "vertical_strategy": "text",  # Try text-based detection
    "snap_tolerance": 5,           # Increase tolerance
    "edge_min_length": 30          # Reduce minimum edge length
}
```

**Issue**: Incorrect time parsing
```python
# Solution: Add more time format patterns
time_patterns = [
    r'(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})',  # 8:30 - 9:20
    r'(\d{1,2})h(\d{2})\s*-\s*(\d{1,2})h(\d{2})',  # 8h30 - 9h20
    r'(\d{1,2})\.(\d{2})\s*-\s*(\d{1,2})\.(\d{2})' # 8.30 - 9.20
]
```

**Issue**: Module code not recognized
```python
# Solution: Expand module code patterns
module_patterns = [
    r'^[A-Z]{3}\s\d{3}$',      # COS 214
    r'^[A-Z]{3}\d{3}$',        # COS214
    r'^[A-Z]{2,4}\s\d{3}$'     # MATH 101
]
```

## References

- [pdfplumber Documentation](https://github.com/jsvine/pdfplumber)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [pandas Documentation](https://pandas.pydata.org/docs)
