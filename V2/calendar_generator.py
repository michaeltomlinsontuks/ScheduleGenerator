
from icalendar import Calendar, Event
from datetime import datetime, timedelta
import pytz
from typing import List, Dict, Any

# Placeholder for semester configuration
# In the future, this will be loaded from config.py
SEMESTER_START_DATE = datetime(2025, 7, 21) # Example: Monday, 21 July 2025
SEMESTER_END_DATE = datetime(2025, 11, 14)   # Example: Friday, 14 November 2025
TIMEZONE = pytz.timezone("Africa/Johannesburg")

# Mapping from day names to icalendar weekday format
DAY_MAP = {
    "Monday": "MO",
    "Tuesday": "TU",
    "Wednesday": "WE",
    "Thursday": "TH",
    "Friday": "FR",
    "Saturday": "SA",
    "Sunday": "SU",
}

def create_calendar(events: List[Dict[str, Any]]) -> Calendar:
    """
    Creates an iCalendar object from a list of processed event dictionaries.

    Args:
        events: A list of cleaned and validated event dictionaries.

    Returns:
        An icalendar.Calendar object populated with the events.
    """
    cal = Calendar()
    cal.add('prodid', '-//UP Schedule Generator V2//michaeltomlinson.com//')
    cal.add('version', '2.0')

    for event_data in events:
        event = Event()
        event.add('summary', event_data['summary'])
        if event_data.get('location'):
            event.add('location', event_data['location'])

        # Check if it's a test or a weekly event
        if 'Date' in event_data and event_data['Date']:
            # This is a single-occurrence test event
            try:
                event_date = datetime.strptime(event_data['Date'], '%d %b %Y')
                start_dt = TIMEZONE.localize(datetime.combine(event_date, datetime.strptime(event_data['start_time'], '%H:%M').time()))
                end_dt = TIMEZONE.localize(datetime.combine(event_date, datetime.strptime(event_data['end_time'], '%H:%M').time()))
                event.add('dtstart', start_dt)
                event.add('dtend', end_dt)
            except (ValueError, KeyError) as e:
                print(f"Skipping test event due to parsing error: {e} in {event_data}")
                continue
        else:
            # This is a recurring weekly event
            try:
                day_of_week = event_data['Day']
                start_time = datetime.strptime(event_data['start_time'], '%H:%M').time()
                end_time = datetime.strptime(event_data['end_time'], '%H:%M').time()

                # Find the first occurrence of this day in the semester
                first_day = SEMESTER_START_DATE
                while first_day.strftime('%A') != day_of_week:
                    first_day += timedelta(days=1)

                start_dt = TIMEZONE.localize(datetime.combine(first_day, start_time))
                end_dt = TIMEZONE.localize(datetime.combine(first_day, end_time))

                event.add('dtstart', start_dt)
                event.add('dtend', end_dt)
                event.add('rrule', {'freq': 'weekly', 'until': SEMESTER_END_DATE})
            except (ValueError, KeyError) as e:
                print(f"Skipping weekly event due to parsing error: {e} in {event_data}")
                continue

        cal.add_component(event)

    return cal

if __name__ == '__main__':
    from pdf_parser import parse_pdf
    from data_processor import process_events

    print("--- Generating Calendar for Weekly Schedule ---")
    weekly_schedule_path = "/Users/michaeltomlinson/Documents/GitHub/ScheduleGenerator/SourceFiles/UP_MOD_XLS.pdf"
    raw_weekly_events = parse_pdf(weekly_schedule_path)
    processed_weekly_events = process_events(raw_weekly_events)
    weekly_cal = create_calendar(processed_weekly_events)

    with open('V2/weekly_schedule.ics', 'wb') as f:
        f.write(weekly_cal.to_ical())
    print("Successfully generated V2/weekly_schedule.ics")

    print("\n" + "="*50 + "\n")

    print("--- Generating Calendar for Test Schedule ---")
    test_schedule_path = "/Users/michaeltomlinson/Documents/GitHub/ScheduleGenerator/SourceFiles/UP_TST_PDF.pdf"
    raw_test_events = parse_pdf(test_schedule_path)
    processed_test_events = process_events(raw_test_events)
    test_cal = create_calendar(processed_test_events)

    with open('V2/test_schedule.ics', 'wb') as f:
        f.write(test_cal.to_ical())
    print("Successfully generated V2/test_schedule.ics")
