import pdfplumber
import pandas as pd
import re
from typing import List, Dict, Any
from .utils import get_pdf_type


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


def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parses a University of Pretoria schedule PDF to extract table data.
    
    Returns:
        Dictionary with 'events' list and 'type' field ('weekly' or 'test')
    """
    pdf_type = get_pdf_type(file_path)
    if pdf_type == 'unknown':
        raise ValueError("Unable to determine PDF type.")

    with pdfplumber.open(file_path) as pdf:
        all_tables = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                all_tables.append(table)

    if pdf_type == 'weekly':
        events = _parse_weekly_schedule(all_tables)
    elif pdf_type == 'test':
        events = _parse_test_schedule(all_tables)
    else:
        events = []

    return {
        'events': events,
        'type': pdf_type
    }
