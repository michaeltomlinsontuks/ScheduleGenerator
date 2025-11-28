from typing import List, Dict, Any
import re


def process_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cleans and validates a list of parsed schedule events.
    Handles all three modes: lecture, test, exam.

    This function standardizes data formats (e.g., day names, times)
    and prepares the event data for calendar generation.

    Args:
        events: A list of event dictionaries from the PDF parser.

    Returns:
        A list of cleaned and validated event dictionaries.
    """
    processed_events = []
    for event in events:
        # 1. Standardize Day Names (for lectures only)
        if 'Day' in event and event['Day']:
            event['Day'] = event['Day'].strip().capitalize()

        # 2. Validate and Clean Time Format
        if 'Time' in event and event['Time']:
            # Try to match time range format (HH:MM-HH:MM) for lectures and tests
            time_match = re.search(r'(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})', event['Time'])
            if time_match:
                event['start_time'] = time_match.group(1)
                event['end_time'] = time_match.group(2)
            else:
                # Try to match single time format (HH:MM) for exams
                single_time_match = re.search(r'(\d{2}:\d{2})', event['Time'])
                if single_time_match:
                    event['start_time'] = single_time_match.group(1)
                    # For exams, default to 3 hours duration
                    start_hour, start_min = map(int, event['start_time'].split(':'))
                    end_hour = (start_hour + 3) % 24
                    event['end_time'] = f"{end_hour:02d}:{start_min:02d}"
                else:
                    # Skip events with invalid times
                    continue

        # 3. Create event summary based on type
        # Determine event type by checking which fields are present
        if 'Module' in event and 'Test' in event:
            # Test event
            event['summary'] = f"{event['Module']} {event['Test']}"
            event['isRecurring'] = False
        elif 'Module' in event and 'Activity' in event:
            # Could be lecture or exam - check for Day field to distinguish
            if 'Day' in event and event['Day']:
                # Lecture event (has Day field)
                event['summary'] = f"{event['Module']} {event['Activity']}"
                event['isRecurring'] = True
            else:
                # Exam event (has Date field instead of Day)
                event['summary'] = f"{event['Module']} {event['Activity']}"
                event['isRecurring'] = False
        else:
            event['summary'] = "Unnamed Event"
            event['isRecurring'] = False

        # 4. Add location information from venue
        if 'Venue' in event:
            event['location'] = event['Venue']

        processed_events.append(event)

    return processed_events
