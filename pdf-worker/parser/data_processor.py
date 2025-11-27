from typing import List, Dict, Any
import re


def process_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cleans and validates a list of parsed schedule events.

    This function standardizes data formats (e.g., day names, times)
    and prepares the event data for calendar generation.

    Args:
        events: A list of event dictionaries from the PDF parser.

    Returns:
        A list of cleaned and validated event dictionaries.
    """
    processed_events = []
    for event in events:
        # 1. Standardize Day Names (e.g., Monday, Tuesday)
        if 'Day' in event and event['Day']:
            event['Day'] = event['Day'].strip().capitalize()

        # 2. Validate and Clean Time Format (HH:MM-HH:MM)
        if 'Time' in event and event['Time']:
            time_match = re.search(r'(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})', event['Time'])
            if time_match:
                event['start_time'] = time_match.group(1)
                event['end_time'] = time_match.group(2)
            else:
                # Handle cases where time might be invalid
                # For now, we'll skip events with invalid times
                continue

        # 3. Create a consistent title for the event
        if 'Module' in event and 'Activity' in event:
            event['summary'] = f"{event['Module']} {event['Activity']}"
        elif 'Module' in event and 'Test' in event:
            event['summary'] = f"{event['Module']} {event['Test']}"
        else:
            event['summary'] = "Unnamed Event"

        # 4. Add location information
        if 'Venue' in event:
            event['location'] = event['Venue']

        processed_events.append(event)

    return processed_events
