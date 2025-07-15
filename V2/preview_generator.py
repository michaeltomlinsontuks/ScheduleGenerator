
from typing import List, Dict, Any
from icalendar import Calendar
from datetime import datetime, timedelta

def generate_preview_summary(events: List[Dict[str, Any]]) -> str:
    """
    Generates a human-readable text summary of the schedule events.

    Args:
        events: A list of processed event dictionaries.

    Returns:
        A formatted string summarizing the schedule.
    """
    if not events:
        return "No events to preview."

    summary = "--- Schedule Preview ---\n\n"
    summary += f"Found {len(events)} total events.\n\n"

    # Group events by day for better readability
    events_by_day = {}
    for event in events:
        day = event.get('Day', 'No Day')
        if day not in events_by_day:
            events_by_day[day] = []
        events_by_day[day].append(event)

    for day, day_events in sorted(events_by_day.items()):
        summary += f"--- {day} ---\n"
        for event in sorted(day_events, key=lambda x: x.get('start_time', '')):
            summary += f"  - {event['summary']}: {event.get('start_time', '')} - {event.get('end_time', '')} @ {event.get('location', 'N/A')}\n"
        summary += "\n"

    return summary

def generate_preview_ics(events: List[Dict[str, Any]], calendar_generator) -> Calendar:
    """
    Generates a one-week preview .ics calendar.

    Args:
        events: A list of processed event dictionaries.
        calendar_generator: The create_calendar function from the calendar_generator module.

    Returns:
        An icalendar.Calendar object containing only the events for the first week.
    """
    # For now, we will just generate a calendar for the first week of the semester
    # A more robust implementation will be added later.
    first_week_events = []
    for event in events:
        # A simple way to get only the first week's events
        # This will be improved later.
        if event.get('Day') in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]:
             first_week_events.append(event)

    # We need to adjust the semester dates for the preview
    original_start_date = calendar_generator.SEMESTER_START_DATE
    calendar_generator.SEMESTER_END_DATE = original_start_date + timedelta(days=6)
    
    preview_cal = calendar_generator.create_calendar(first_week_events)

    # Restore the original semester end date
    calendar_generator.SEMESTER_END_DATE = datetime(2025, 11, 14) # Restore original

    return preview_cal


if __name__ == '__main__':
    from pdf_parser import parse_pdf
    from data_processor import process_events
    import calendar_generator

    print("--- Generating Preview for Weekly Schedule ---")
    weekly_schedule_path = "/Users/michaeltomlinson/Documents/GitHub/ScheduleGenerator/SourceFiles/UP_MOD_XLS.pdf"
    raw_weekly_events = parse_pdf(weekly_schedule_path)
    processed_weekly_events = process_events(raw_weekly_events)
    
    # Generate and print the text summary
    summary_text = generate_preview_summary(processed_weekly_events)
    print(summary_text)

    # Generate the one-week preview .ics file
    preview_cal = generate_preview_ics(processed_weekly_events, calendar_generator)
    with open('V2/preview_schedule.ics', 'wb') as f:
        f.write(preview_cal.to_ical())
    print("\nSuccessfully generated V2/preview_schedule.ics")
