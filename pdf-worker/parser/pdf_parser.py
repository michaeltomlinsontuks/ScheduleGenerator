import pdfplumber
import pandas as pd
import re
import signal
from contextlib import contextmanager
from typing import List, Dict, Any
from .utils import get_pdf_type


class TimeoutException(Exception):
    """Raised when PDF processing exceeds timeout"""
    pass


class PDFSizeException(Exception):
    """Raised when PDF exceeds size limits"""
    pass


@contextmanager
def timeout(seconds):
    """Context manager for timeout protection"""
    def signal_handler(signum, frame):
        raise TimeoutException(f"Operation timed out after {seconds} seconds")
    
    # Set the signal handler and alarm
    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        # Disable the alarm
        signal.alarm(0)


def _parse_weekly_schedule(tables: List[List[str]]) -> List[Dict[str, Any]]:
    """
    Parses the raw table data from a weekly schedule PDF.
    """
    events = []
    headers = [h.replace('\n', ' ') for h in tables[0][0]]

    for table in tables:
        df = pd.DataFrame(table[1:], columns=headers)
        df.columns = [col.replace('\n', ' ') for col in df.columns]

        for col in ['Module', 'Offered', 'Group', 'Lang']:
            if col in df.columns:
                df[col] = df[col].replace('', None).ffill()

        for col in df.columns:
            df[col] = df[col].astype(str).str.strip()

        df.dropna(subset=['Day', 'Time'], inplace=True, how='all')

        for _, row in df.iterrows():
            base_event = row.to_dict()
            days = str(base_event['Day']).split('\n')
            times = re.findall(r'\d{2}:\d{2}\s*-\s*\d{2}:\d{2}', str(base_event['Time']))
            venues = str(base_event['Venue']).split('\n')
            activities = str(base_event['Activity']).split('\n')

            max_len = len(days)
            times.extend([times[-1]] * (max_len - len(times))) if times else None
            venues.extend([venues[-1]] * (max_len - len(venues))) if venues else None
            activities.extend([activities[-1]] * (max_len - len(activities))) if activities else None

            for i in range(max_len):
                if i < len(times) and i < len(venues) and i < len(activities):
                    event = base_event.copy()
                    event['Day'] = days[i].strip()
                    event['Time'] = times[i].strip()
                    event['Venue'] = venues[i].strip()
                    event['Activity'] = activities[i].strip()
                    events.append(event)
    return events


def _parse_test_schedule(tables: List[List[str]]) -> List[Dict[str, Any]]:
    """
    Parses the raw table data from a test schedule PDF.
    """
    events = []
    headers = [h.replace('\n', ' ') for h in tables[0][0]]

    for table in tables:
        df = pd.DataFrame(table[1:], columns=headers)
        df.columns = [col.replace('\n', ' ') for col in df.columns]

        for col in ['Module', 'Test']:
            if col in df.columns:
                df[col] = df[col].replace('', None).ffill()

        for col in df.columns:
            df[col] = df[col].astype(str).str.strip()

        df.dropna(subset=['Date', 'Time'], inplace=True, how='all')

        for _, row in df.iterrows():
            base_event = row.to_dict()
            venues = str(base_event['Venue']).split('\n')
            for venue in venues:
                if venue:
                    event = base_event.copy()
                    event['Venue'] = venue.strip()
                    events.append(event)
    return events


def _parse_exam_schedule(tables: List[List[str]]) -> List[Dict[str, Any]]:
    """
    Parses the raw table data from an exam schedule PDF.
    
    Exam schedules have a different structure from tests:
    - Status (e.g., "FINAL")
    - Module code
    - Paper number
    - Activity (e.g., "Exam\nWritten")
    - Date (specific date, not day of week)
    - Start Time (just start time, not range)
    - Module Campus
    - Exam Campus
    - Venue (may have newline-separated details like "IT Building CBT Labs\n1,2,3")
    - Exam Comments
    
    Returns:
        List of event dictionaries with exam information.
    """
    events = []
    headers = [h.replace('\n', ' ') for h in tables[0][0]]
    
    for table in tables:
        df = pd.DataFrame(table[1:], columns=headers)
        df.columns = [col.replace('\n', ' ') for col in df.columns]
        
        # Forward-fill module and status columns (they span multiple rows)
        for col in ['Module', 'Status']:
            if col in df.columns:
                df[col] = df[col].replace('', None).ffill()
        
        # Clean whitespace from all columns
        for col in df.columns:
            df[col] = df[col].astype(str).str.strip()
        
        # Drop rows without date or start time
        df.dropna(subset=['Date', 'Start Time'], inplace=True, how='all')
        
        # Process each row
        for _, row in df.iterrows():
            event = row.to_dict()
            
            # Combine venue details (newline-separated parts become single string)
            if 'Venue' in event:
                venue_parts = str(event['Venue']).split('\n')
                event['Venue'] = ' '.join(part.strip() for part in venue_parts if part.strip())
            
            # Clean activity field (remove newlines)
            if 'Activity' in event:
                event['Activity'] = str(event['Activity']).replace('\n', ' ').strip()
            
            # Note: Exam PDFs don't have end time, we'll need to estimate duration
            # Default to 3 hours for exams
            if 'Start Time' in event:
                event['Time'] = event['Start Time']  # Will be processed later
            
            events.append(event)
    
    return events


def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parses a Tuks schedule PDF to extract table data.
    
    Includes timeout protection (60 seconds) and page limit validation (100 pages).
    
    Returns:
        Dictionary with 'events' list and 'type' field 
        ('lecture', 'test', or 'exam')
    
    Raises:
        TimeoutException: If parsing exceeds 60 seconds
        PDFSizeException: If PDF exceeds 100 pages
        ValueError: If PDF type cannot be determined or parsing fails
    """
    try:
        with timeout(60):  # 60 second timeout
            pdf_type = get_pdf_type(file_path)
            
            if pdf_type == 'unknown':
                raise ValueError(
                    "Unable to determine PDF type. "
                    "Expected 'Lectures', 'Semester Tests', or 'Exams' text."
                )

            with pdfplumber.open(file_path) as pdf:
                # Enforce page limit
                if len(pdf.pages) > 100:
                    raise PDFSizeException(
                        f"PDF exceeds maximum page limit. "
                        f"Found {len(pdf.pages)} pages, maximum is 100 pages."
                    )
                
                all_tables = []
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        all_tables.append(table)

            # Route to appropriate parser based on detected type
            if pdf_type == 'lecture':
                events = _parse_weekly_schedule(all_tables)
            elif pdf_type == 'test':
                events = _parse_test_schedule(all_tables)
            elif pdf_type == 'exam':
                events = _parse_exam_schedule(all_tables)
            else:
                # This should never be reached due to the check above,
                # but included for completeness
                raise ValueError(f"Unsupported PDF type: {pdf_type}")

            return {
                'events': events,
                'type': pdf_type
            }
    except TimeoutException as e:
        raise ValueError(f"PDF parsing timeout: {str(e)}")
    except PDFSizeException as e:
        raise ValueError(f"PDF size limit exceeded: {str(e)}")
    except Exception as e:
        raise ValueError(f"PDF parsing failed: {str(e)}")
